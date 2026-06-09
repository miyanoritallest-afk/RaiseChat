import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../uploads/s3.service'
import { CreateDmMessageDto } from './dto/create-dm-message.dto'

const DM_ROOM_SELECT = {
  id: true,
  name: true,
  isGroup: true,
  createdAt: true,
  members: {
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          status: true,
        },
      },
    },
  },
} as const

const DM_MESSAGE_SELECT = {
  id: true,
  content: true,
  dmRoomId: true,
  editedAt: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      status: true,
    },
  },
  attachments: {
    select: {
      id: true,
      fileUrl: true,
      fileType: true,
      fileName: true,
      fileSize: true,
    },
  },
} as const

@Injectable()
export class DmRoomsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  // DB の fileUrl カラムには S3 キーが入っている。読み取り時に署名付き URL へ変換する
  // S3 障害やキー不正でも他メッセージへの影響を防ぐため、失敗した添付は fileUrl を null にする
  private async resolveAttachmentUrls<
    T extends {
      attachments: {
        id: string
        fileUrl: string | null
        fileType: string
        fileName: string
        fileSize: number
      }[]
    },
  >(message: T): Promise<T> {
    if (!message.attachments || message.attachments.length === 0) return message
    const resolved = await Promise.all(
      message.attachments.map(async (a) => {
        try {
          return { ...a, fileUrl: await this.s3Service.getSignedUrl(a.fileUrl as string) }
        } catch {
          return { ...a, fileUrl: null }
        }
      }),
    )
    return { ...message, attachments: resolved }
  }

  async findManyByUserId(userId: string, workspaceId: string) {
    const members = await this.prisma.dmRoomMember.findMany({
      where: { userId, dmRoom: { workspaceId } },
      orderBy: { position: 'asc' },
      select: { dmRoomId: true },
    })
    const orderedIds = members.map((m) => m.dmRoomId)

    const rooms = await this.prisma.dmRoom.findMany({
      where: { workspaceId, members: { some: { userId } } },
      select: DM_ROOM_SELECT,
    })

    const orderedSet = new Set(orderedIds)
    const ordered = orderedIds
      .map((id) => rooms.find((r) => r.id === id))
      .filter((r): r is NonNullable<typeof r> => r !== undefined)
    const rest = rooms
      .filter((r) => !orderedSet.has(r.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return [...ordered, ...rest]
  }

  async reorder(userId: string, dmRoomIds: string[]) {
    await this.prisma.$transaction(
      dmRoomIds.map((dmRoomId, index) =>
        this.prisma.dmRoomMember.update({
          where: { dmRoomId_userId: { dmRoomId, userId } },
          data: { position: index },
        }),
      ),
    )
  }

  async findById(dmRoomId: string) {
    return this.prisma.dmRoom.findUnique({
      where: { id: dmRoomId },
      select: DM_ROOM_SELECT,
    })
  }

  async areAllWorkspaceMembers(workspaceId: string, userIds: string[]): Promise<boolean> {
    const count = await this.prisma.workspaceMember.count({
      where: { workspaceId, userId: { in: userIds } },
    })
    return count === userIds.length
  }

  async isMember(userId: string, dmRoomId: string): Promise<boolean> {
    const member = await this.prisma.dmRoomMember.findUnique({
      where: { dmRoomId_userId: { dmRoomId, userId } },
      select: { id: true },
    })
    return !!member
  }

  // 1対1DMの場合は同一ワークスペース内の既存部屋を返し、なければ新規作成する（重複防止）
  async findOrCreateDirectRoom(workspaceId: string, myUserId: string, otherUserId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const candidates = await tx.dmRoom.findMany({
        where: {
          workspaceId,
          isGroup: false,
          members: { some: { userId: myUserId } },
        },
        select: DM_ROOM_SELECT,
      })

      type Candidate = (typeof candidates)[number]
      type Member = Candidate['members'][number]
      const existing = candidates.find(
        (room: Candidate) =>
          room.members.length === 2 && room.members.some((m: Member) => m.userId === otherUserId),
      )
      if (existing) return existing

      return tx.dmRoom.create({
        data: {
          workspaceId,
          isGroup: false,
          members: {
            create: [{ userId: myUserId }, { userId: otherUserId }],
          },
        },
        select: DM_ROOM_SELECT,
      })
    })
  }

  async createGroupRoom(workspaceId: string, myUserId: string, memberIds: string[], name?: string) {
    const allMemberIds = Array.from(new Set([myUserId, ...memberIds]))
    return this.prisma.dmRoom.create({
      data: {
        workspaceId,
        isGroup: true,
        name: name ?? null,
        members: {
          create: allMemberIds.map((userId) => ({ userId })),
        },
      },
      select: DM_ROOM_SELECT,
    })
  }

  async findMessagesByDmRoomId(dmRoomId: string, cursor?: string, limit = 50) {
    const rows = await this.prisma.dmMessage.findMany({
      where: { dmRoomId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: DM_MESSAGE_SELECT,
    })
    type Row = (typeof rows)[number]
    return Promise.all(rows.map((r: Row) => this.resolveAttachmentUrls(r)))
  }

  async createMessage(dmRoomId: string, userId: string, dto: CreateDmMessageDto) {
    const row = await this.prisma.dmMessage.create({
      data: { dmRoomId, userId, content: dto.content },
      select: DM_MESSAGE_SELECT,
    })
    return this.resolveAttachmentUrls(row)
  }

  async findMessageById(messageId: string) {
    const row = await this.prisma.dmMessage.findUnique({
      where: { id: messageId },
      select: { ...DM_MESSAGE_SELECT, userId: true },
    })
    if (!row) return null
    return this.resolveAttachmentUrls(row)
  }

  async updateMessage(messageId: string, content: string) {
    const row = await this.prisma.dmMessage.update({
      where: { id: messageId },
      data: { content, editedAt: new Date() },
      select: DM_MESSAGE_SELECT,
    })
    return this.resolveAttachmentUrls(row)
  }

  async updateDmRoom(dmRoomId: string, name: string) {
    return this.prisma.dmRoom.update({
      where: { id: dmRoomId },
      data: { name },
      select: DM_ROOM_SELECT,
    })
  }

  async softDeleteMessage(messageId: string) {
    return this.prisma.dmMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
      select: { id: true, dmRoomId: true },
    })
  }
}
