import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const SEARCH_MESSAGE_SELECT = {
  id: true,
  content: true,
  createdAt: true,
  channel: {
    select: { id: true, name: true },
  },
  user: {
    select: { id: true, displayName: true, avatarUrl: true },
  },
} as const

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchMessages(
    workspaceId: string,
    userId: string,
    query: string,
    cursor?: string,
    limit = 20,
  ) {
    return this.prisma.message.findMany({
      where: {
        deletedAt: null,
        content: { contains: query, mode: 'insensitive' },
        channel: {
          workspaceId,
          // 参加していないプライベートチャンネルのメッセージを除外（IDOR 対策）
          OR: [{ isPrivate: false }, { members: { some: { userId } } }],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: SEARCH_MESSAGE_SELECT,
    })
  }
}
