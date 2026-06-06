import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const PIN_SELECT = {
  id: true,
  messageId: true,
  channelId: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  message: {
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  },
} as const

@Injectable()
export class PinsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyByChannelId(channelId: string) {
    return this.prisma.pin.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
      select: PIN_SELECT,
    })
  }

  async findById(pinId: string) {
    return this.prisma.pin.findUnique({
      where: { id: pinId },
      select: {
        ...PIN_SELECT,
        userId: true,
      },
    })
  }

  async findByMessageAndChannel(messageId: string, channelId: string) {
    return this.prisma.pin.findUnique({
      where: { messageId_channelId: { messageId, channelId } },
      select: {
        ...PIN_SELECT,
        userId: true,
      },
    })
  }

  async create(messageId: string, channelId: string, userId: string) {
    return this.prisma.pin.create({
      data: { messageId, channelId, userId },
      select: PIN_SELECT,
    })
  }

  async delete(pinId: string) {
    return this.prisma.pin.delete({
      where: { id: pinId },
      select: { id: true, channelId: true },
    })
  }

  async getChannelWorkspaceId(channelId: string): Promise<string | null> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { workspaceId: true },
    })
    return channel?.workspaceId ?? null
  }
}
