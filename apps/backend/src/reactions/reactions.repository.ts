import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ReactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByMessageId(messageId: string) {
    return this.prisma.reaction.findMany({
      where: { messageId },
      select: { emoji: true, userId: true },
    })
  }

  async findOne(messageId: string, userId: string, emoji: string) {
    return this.prisma.reaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      select: { id: true },
    })
  }

  async create(messageId: string, userId: string, emoji: string) {
    return this.prisma.reaction.create({
      data: { messageId, userId, emoji },
      select: { emoji: true, userId: true },
    })
  }

  async delete(messageId: string, userId: string, emoji: string) {
    return this.prisma.reaction.delete({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      select: { emoji: true, userId: true },
    })
  }
}
