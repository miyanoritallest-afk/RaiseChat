import { Injectable } from '@nestjs/common'
import { NotificationType } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationsRepository } from './notifications.repository'
import { GetNotificationsDto } from './dto/get-notifications.dto'

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async getNotifications(userId: string, dto: GetNotificationsDto) {
    const limit = dto.limit ?? 20
    const rows = await this.notificationsRepository.findManyByUserId(userId, dto.cursor, limit)
    const hasMore = rows.length > limit
    const notifications = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? notifications[notifications.length - 1].id : null
    const unreadCount = await this.notificationsRepository.countUnread(userId)
    return { notifications, nextCursor, hasMore, unreadCount }
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.notificationsRepository.markAsRead(notificationId, userId)
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepository.markAllAsRead(userId)
  }

  /**
   * メッセージ内の @username をパースして対象ユーザーに MENTION 通知を生成する。
   * @が含まれない場合は即時スキップしてパフォーマンスを保つ。
   */
  async notifyMentions(
    content: string,
    messageId: string,
    channelId: string,
    senderId: string,
  ): Promise<void> {
    if (!content.includes('@')) return

    const usernameMatches = content.match(/@([a-zA-Z0-9_.-]+)/g)
    if (!usernameMatches || usernameMatches.length === 0) return

    const usernames = usernameMatches.map((m) => m.slice(1))

    // チャンネルメンバー内に絞ってメンション対象を特定（スパム防止）
    const channelMembers = await this.prisma.channelMember.findMany({
      where: {
        channelId,
        user: { username: { in: usernames } },
        userId: { not: senderId },
      },
      select: { userId: true },
    })

    await Promise.all(
      channelMembers.map((member) =>
        this.notificationsRepository.createIfNotExists({
          type: NotificationType.MENTION,
          userId: member.userId,
          messageId,
          channelId,
        }),
      ),
    )
  }

  /**
   * スレッド返信時に親メッセージ投稿者へ THREAD_REPLY 通知を生成する。
   * 自分への返信は通知しない。
   */
  async notifyThreadReply(
    parentMessageId: string,
    replyMessageId: string,
    senderId: string,
  ): Promise<void> {
    const parent = await this.prisma.message.findUnique({
      where: { id: parentMessageId },
      select: { userId: true, channelId: true },
    })
    if (!parent || parent.userId === senderId) return

    await this.notificationsRepository.createIfNotExists({
      type: NotificationType.THREAD_REPLY,
      userId: parent.userId,
      messageId: replyMessageId,
      channelId: parent.channelId,
    })
  }

  /**
   * DM送信時に相手メンバーへ UNREAD 通知を生成する。
   * 1 DM部屋につき 1 通知/ユーザーとして管理する（dmRoomId で重複チェック）。
   */
  async notifyDmUnread(dmRoomId: string, senderId: string): Promise<void> {
    const members = await this.prisma.dmRoomMember.findMany({
      where: { dmRoomId, userId: { not: senderId } },
      select: { userId: true },
    })

    await Promise.all(
      members.map((member) =>
        this.notificationsRepository.createIfNotExists({
          type: NotificationType.UNREAD,
          userId: member.userId,
          dmRoomId,
        }),
      ),
    )
  }

  async notifyChannelInvited(channelId: string, userId: string): Promise<void> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { workspaceId: true },
    })
    await this.notificationsRepository.createIfNotExists({
      type: NotificationType.CHANNEL_INVITED,
      userId,
      channelId,
      workspaceId: channel?.workspaceId,
    })
  }

  async notifyWorkspaceInvited(workspaceId: string, userId: string): Promise<void> {
    await this.notificationsRepository.createIfNotExists({
      type: NotificationType.WORKSPACE_INVITED,
      userId,
      workspaceId,
    })
  }

  /**
   * リアクション追加時にメッセージ投稿者へ REACTION_ADDED 通知を生成する。
   * 自分自身のメッセージへのリアクションは通知しない。
   */
  async notifyReactionAdded(messageId: string, reactorUserId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { userId: true, channelId: true },
    })
    if (!message || message.userId === reactorUserId) return

    await this.notificationsRepository.createIfNotExists({
      type: NotificationType.REACTION_ADDED,
      userId: message.userId,
      messageId,
      channelId: message.channelId,
    })
  }
}
