import { Injectable } from '@nestjs/common'
import { NotificationType } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  isRead: true,
  createdAt: true,
  messageId: true,
  channelId: true,
  workspaceId: true,
  channel: { select: { id: true, name: true } },
  workspace: { select: { id: true, name: true } },
  message: {
    select: {
      id: true,
      content: true,
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  },
} as const

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyByUserId(userId: string, cursor?: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: NOTIFICATION_SELECT,
    })
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } })
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    })
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }

  /**
   * 重複通知を防ぐため (type, userId, messageId) の組み合わせが既存の場合は作成しない。
   * upsert は使わず findFirst + create にすることで、messageId が null の場合も安全に処理する。
   */
  async createIfNotExists(data: {
    type: NotificationType
    userId: string
    messageId?: string
    channelId?: string
    workspaceId?: string
  }) {
    if (data.messageId) {
      const existing = await this.prisma.notification.findFirst({
        where: { type: data.type, userId: data.userId, messageId: data.messageId },
        select: { id: true },
      })
      if (existing) return existing
    }

    return this.prisma.notification.create({
      data: {
        type: data.type,
        userId: data.userId,
        messageId: data.messageId,
        channelId: data.channelId,
        workspaceId: data.workspaceId,
      },
      select: { id: true },
    })
  }
}
