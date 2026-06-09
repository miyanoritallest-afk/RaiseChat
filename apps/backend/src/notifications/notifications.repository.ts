import { Injectable } from '@nestjs/common'
import { NotificationType } from '.prisma/client'
import { PrismaService } from '../prisma/prisma.service'

const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  isRead: true,
  createdAt: true,
  messageId: true,
  channelId: true,
  dmRoomId: true,
  workspaceId: true,
  channel: { select: { id: true, name: true } },
  dmRoom: { select: { id: true, name: true } },
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

  async markReadByChannel(userId: string, channelId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, channelId, isRead: false },
      data: { isRead: true },
    })
  }

  async markReadByDmRoom(userId: string, dmRoomId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, dmRoomId, isRead: false },
      data: { isRead: true },
    })
  }

  /**
   * 重複通知を防ぐため既存レコードがあれば作成しない。
   * - messageId あり: (type, userId, messageId) で重複チェック
   * - dmRoomId あり : (type, userId, dmRoomId) で重複チェック。
   *   1 DM部屋につき 1 UNREAD 通知/ユーザーとして管理する。
   * upsert は使わず findFirst + create にすることで null 混在ケースも安全に処理する。
   */
  async createIfNotExists(data: {
    type: NotificationType
    userId: string
    messageId?: string
    channelId?: string
    dmRoomId?: string
    workspaceId?: string
  }) {
    if (data.messageId) {
      const existing = await this.prisma.notification.findFirst({
        where: { type: data.type, userId: data.userId, messageId: data.messageId },
        select: { id: true },
      })
      if (existing) return existing
    } else if (data.dmRoomId) {
      const existing = await this.prisma.notification.findFirst({
        where: { type: data.type, userId: data.userId, dmRoomId: data.dmRoomId },
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
        dmRoomId: data.dmRoomId,
        workspaceId: data.workspaceId,
      },
      select: { id: true },
    })
  }
}
