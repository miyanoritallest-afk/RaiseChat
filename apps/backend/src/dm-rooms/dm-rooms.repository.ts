import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
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
  constructor(private readonly prisma: PrismaService) {}

  async findManyByUserId(userId: string) {
    return this.prisma.dmRoom.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'desc' },
      select: DM_ROOM_SELECT,
    })
  }

  async findById(dmRoomId: string) {
    return this.prisma.dmRoom.findUnique({
      where: { id: dmRoomId },
      select: DM_ROOM_SELECT,
    })
  }

  async isMember(userId: string, dmRoomId: string): Promise<boolean> {
    const member = await this.prisma.dmRoomMember.findUnique({
      where: { dmRoomId_userId: { dmRoomId, userId } },
      select: { id: true },
    })
    return !!member
  }

  // 1対1DMの場合は既存部屋を返し、なければ新規作成する（重複防止）
  async findOrCreateDirectRoom(myUserId: string, otherUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 2人のみのisGroup=false部屋を探す
      const candidates = await tx.dmRoom.findMany({
        where: {
          isGroup: false,
          members: { some: { userId: myUserId } },
        },
        include: { members: { select: { userId: true } } },
      })

      // JS側でotherUserIdを含む2人部屋を特定（PrismaのexactlyN件条件を補う）
      const existing = candidates.find(
        (room) => room.members.length === 2 && room.members.some((m) => m.userId === otherUserId),
      )
      if (existing) return existing

      return tx.dmRoom.create({
        data: {
          isGroup: false,
          members: {
            create: [{ userId: myUserId }, { userId: otherUserId }],
          },
        },
        select: DM_ROOM_SELECT,
      })
    })
  }

  async createGroupRoom(myUserId: string, memberIds: string[], name?: string) {
    const allMemberIds = Array.from(new Set([myUserId, ...memberIds]))
    return this.prisma.dmRoom.create({
      data: {
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
    return this.prisma.dmMessage.findMany({
      where: { dmRoomId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: DM_MESSAGE_SELECT,
    })
  }

  async createMessage(dmRoomId: string, userId: string, dto: CreateDmMessageDto) {
    return this.prisma.dmMessage.create({
      data: { dmRoomId, userId, content: dto.content },
      select: DM_MESSAGE_SELECT,
    })
  }

  async findMessageById(messageId: string) {
    return this.prisma.dmMessage.findUnique({
      where: { id: messageId },
      select: { ...DM_MESSAGE_SELECT, userId: true },
    })
  }

  async updateMessage(messageId: string, content: string) {
    return this.prisma.dmMessage.update({
      where: { id: messageId },
      data: { content, editedAt: new Date() },
      select: DM_MESSAGE_SELECT,
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
