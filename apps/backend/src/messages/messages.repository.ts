import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
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
} as const

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyByChannelId(channelId: string, cursor?: string, limit = 50) {
    return this.prisma.message.findMany({
      where: { channelId, threadId: null, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: MESSAGE_SELECT,
    })
  }

  async findById(messageId: string) {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        ...MESSAGE_SELECT,
        userId: true,
      },
    })
  }

  async create(channelId: string, userId: string, dto: CreateMessageDto) {
    return this.prisma.message.create({
      data: {
        channelId,
        userId,
        content: dto.content,
        threadId: dto.threadId,
      },
      select: MESSAGE_SELECT,
    })
  }

  async update(messageId: string, content: string) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { content, editedAt: new Date() },
      select: MESSAGE_SELECT,
    })
  }

  async softDelete(messageId: string) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
      select: { id: true, channelId: true },
    })
  }
}
