import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { S3Service } from '../uploads/s3.service'
import { CreateMessageDto } from './dto/create-message.dto'

const MESSAGE_SELECT = {
  id: true,
  content: true,
  channelId: true,
  threadId: true,
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
  reactions: {
    select: {
      emoji: true,
      userId: true,
    },
  },
  _count: {
    select: { replies: true },
  },
  replies: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' as const },
    take: 3,
    select: {
      user: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  },
} as const

type MessageRow = Awaited<ReturnType<PrismaService['message']['findUniqueOrThrow']>> & {
  attachments: {
    id: string
    fileUrl: string
    fileType: string
    fileName: string
    fileSize: number
  }[]
}

type RawMessage = Awaited<ReturnType<PrismaService['message']['findMany']>>[number] & {
  attachments: {
    id: string
    fileUrl: string
    fileType: string
    fileName: string
    fileSize: number
  }[]
}

@Injectable()
export class MessagesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  // DB の fileUrl カラムには S3 キーが入っている。読み取り時に署名付き URL へ変換する
  // S3 障害やキー不正でも他メッセージへの影響を防ぐため、失敗した添付は fileUrl を null にしてフォールバック
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

  private async resolveMany<
    T extends {
      attachments: {
        id: string
        fileUrl: string | null
        fileType: string
        fileName: string
        fileSize: number
      }[]
    },
  >(messages: T[]): Promise<T[]> {
    return Promise.all(messages.map((m) => this.resolveAttachmentUrls(m)))
  }

  async findManyByChannelId(channelId: string, cursor?: string, limit = 50) {
    const rows = await this.prisma.message.findMany({
      where: { channelId, threadId: null, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: MESSAGE_SELECT,
    })
    return this.resolveMany(rows as unknown as RawMessage[])
  }

  async findById(messageId: string) {
    const row = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        ...MESSAGE_SELECT,
        userId: true,
      },
    })
    if (!row) return null
    return this.resolveAttachmentUrls(row as unknown as RawMessage & { userId: string })
  }

  async create(channelId: string, userId: string, dto: CreateMessageDto) {
    if (!dto.attachments || dto.attachments.length === 0) {
      const row = await this.prisma.message.create({
        data: { channelId, userId, content: dto.content, threadId: dto.threadId },
        select: MESSAGE_SELECT,
      })
      return this.resolveAttachmentUrls(row as unknown as RawMessage)
    }

    // 添付ファイルがある場合はメッセージと添付を $transaction で同時作成
    const row = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: { channelId, userId, content: dto.content, threadId: dto.threadId },
        select: { id: true },
      })
      await tx.messageAttachment.createMany({
        data: dto.attachments!.map((a) => ({
          messageId: message.id,
          fileUrl: a.s3Key, // S3 キーを DB に保存
          fileType: a.fileType,
          fileName: a.fileName,
          fileSize: a.fileSize,
        })),
      })
      return tx.message.findUniqueOrThrow({
        where: { id: message.id },
        select: MESSAGE_SELECT,
      })
    })
    return this.resolveAttachmentUrls(row as unknown as RawMessage)
  }

  async update(messageId: string, content: string) {
    const row = await this.prisma.message.update({
      where: { id: messageId },
      data: { content, editedAt: new Date() },
      select: MESSAGE_SELECT,
    })
    return this.resolveAttachmentUrls(row as unknown as RawMessage)
  }

  async softDelete(messageId: string) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
      select: { id: true, channelId: true },
    })
  }

  async findRepliesByMessageId(parentMessageId: string, cursor?: string, limit = 50) {
    const rows = await this.prisma.message.findMany({
      where: { threadId: parentMessageId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: MESSAGE_SELECT,
    })
    return this.resolveMany(rows as unknown as RawMessage[])
  }
}
