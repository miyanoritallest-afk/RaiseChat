import { Injectable } from '@nestjs/common'
import { WsException } from '@nestjs/websockets'
import { PrismaService } from '../prisma/prisma.service'
import { MessagesRepository } from '../messages/messages.repository'
import { WorkspacesRepository } from '../workspaces/workspaces.repository'
import { DmRoomsRepository } from '../dm-rooms/dm-rooms.repository'
import { NotificationsService } from '../notifications/notifications.service'
import { ReactionsService } from '../reactions/reactions.service'
import { PinsService } from '../pins/pins.service'
import type { AttachmentDto } from '../messages/dto/create-message.dto'

@Injectable()
export class GatewayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesRepository: MessagesRepository,
    private readonly workspacesRepository: WorkspacesRepository,
    private readonly dmRoomsRepository: DmRoomsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly reactionsService: ReactionsService,
    private readonly pinsService: PinsService,
  ) {}

  async isWorkspaceMember(userId: string, workspaceId: string): Promise<boolean> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      select: { id: true },
    })
    return !!member
  }

  async isChannelMember(userId: string, channelId: string): Promise<boolean> {
    const member = await this.prisma.channelMember.findUnique({
      where: { userId_channelId: { userId, channelId } },
      select: { id: true },
    })
    return !!member
  }

  async getUserWorkspaceIds(userId: string): Promise<string[]> {
    const members = await this.prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    })
    return members.map((m: { workspaceId: string }) => m.workspaceId)
  }

  async setUserOnline(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ONLINE' },
    })
  }

  async setUserOffline(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'OFFLINE' },
    })
  }

  async getMessageById(messageId: string) {
    return this.messagesRepository.findById(messageId)
  }

  async createMessage(data: {
    channelId: string
    userId: string
    content: string
    threadId?: string
    attachments?: AttachmentDto[]
  }) {
    // 添付の s3Key プレフィックスがチャンネルのワークスペースと一致するか検証（クロスワークスペース IDOR 防止）
    if (data.attachments && data.attachments.length > 0) {
      const channel = await this.prisma.channel.findUnique({
        where: { id: data.channelId },
        select: { workspaceId: true },
      })
      if (!channel) throw new WsException('チャンネルが存在しません')
      for (const a of data.attachments) {
        if (!a.s3Key.startsWith(`${channel.workspaceId}/`)) {
          throw new WsException('添付ファイルのキーが不正です')
        }
      }
    }

    const message = await this.messagesRepository.create(data.channelId, data.userId, {
      content: data.content,
      threadId: data.threadId,
      attachments: data.attachments,
    })

    // fire-and-forget: 通知はメッセージ送信レイテンシに影響させない
    void this.notificationsService.notifyMentions(
      data.content,
      message.id,
      data.channelId,
      data.userId,
    )
    if (data.threadId) {
      void this.notificationsService.notifyThreadReply(data.threadId, message.id, data.userId)
    }

    return message
  }

  /**
   * メンション通知のソケット送信先ユーザーIDを返す。
   * chat.gateway.ts が notification:received を user:X ルームに emit するために使う。
   */
  async getMentionTargetUserIds(
    content: string,
    channelId: string,
    senderId: string,
  ): Promise<string[]> {
    if (!content.includes('@')) return []
    const usernameMatches = content.match(/@([a-zA-Z0-9_.-]+)/g)
    if (!usernameMatches) return []
    const usernames = usernameMatches.map((m) => m.slice(1))
    const members = await this.prisma.channelMember.findMany({
      where: {
        channelId,
        user: { username: { in: usernames } },
        userId: { not: senderId },
      },
      select: { userId: true },
    })
    return members.map((m: { userId: string }) => m.userId)
  }

  async updateMessage(data: { messageId: string; userId: string; content: string }) {
    const message = await this.messagesRepository.findById(data.messageId)
    if (!message) return null

    const isAuthor = message.userId === data.userId
    if (!isAuthor) {
      const channel = await this.prisma.channel.findUnique({
        where: { id: message.channelId },
        select: { workspaceId: true },
      })
      const isOwner = channel
        ? await this.workspacesRepository.isOwner(data.userId, channel.workspaceId)
        : false
      if (!isOwner) return null
    }

    return this.messagesRepository.update(data.messageId, data.content)
  }

  async deleteMessage(data: { messageId: string; userId: string }) {
    const message = await this.messagesRepository.findById(data.messageId)
    if (!message) return null

    const isAuthor = message.userId === data.userId
    if (!isAuthor) return null

    return this.messagesRepository.softDelete(data.messageId)
  }

  // --- DM 関連 ---

  /** DM ルームの送信者以外のメンバー ID 一覧を返す（通知送信先の特定に使用） */
  async getDmRoomMemberIds(dmRoomId: string, excludeUserId: string): Promise<string[]> {
    const members = await this.prisma.dmRoomMember.findMany({
      where: { dmRoomId, userId: { not: excludeUserId } },
      select: { userId: true },
    })
    return members.map((m: { userId: string }) => m.userId)
  }

  async isDmRoomMember(userId: string, dmRoomId: string): Promise<boolean> {
    return this.dmRoomsRepository.isMember(userId, dmRoomId)
  }

  async createDmMessage(data: { dmRoomId: string; userId: string; content: string }) {
    const message = await this.dmRoomsRepository.createMessage(data.dmRoomId, data.userId, {
      content: data.content,
    })

    // fire-and-forget: DM受信通知
    void this.notificationsService.notifyDmUnread(data.dmRoomId, data.userId)

    return message
  }

  async updateDmMessage(data: {
    messageId: string
    dmRoomId: string
    userId: string
    content: string
  }) {
    const message = await this.dmRoomsRepository.findMessageById(data.messageId)
    if (!message || message.dmRoomId !== data.dmRoomId) return null
    if (message.userId !== data.userId) return null
    return this.dmRoomsRepository.updateMessage(data.messageId, data.content)
  }

  async deleteDmMessage(data: { messageId: string; dmRoomId: string; userId: string }) {
    const message = await this.dmRoomsRepository.findMessageById(data.messageId)
    if (!message || message.dmRoomId !== data.dmRoomId) return null
    if (message.userId !== data.userId) return null
    return this.dmRoomsRepository.softDeleteMessage(data.messageId)
  }

  // --- ピン留め ---

  async addPin(data: { messageId: string; channelId: string; userId: string }) {
    return this.pinsService.addPin(data.messageId, data.channelId, data.userId)
  }

  async removePin(data: { messageId: string; channelId: string; userId: string }) {
    return this.pinsService.removePin(data.messageId, data.channelId, data.userId)
  }

  // --- リアクション ---

  async toggleReaction(data: {
    messageId: string
    channelId: string
    userId: string
    emoji: string
  }): Promise<{ messageId: string; reactions: { emoji: string; userIds: string[] }[] } | null> {
    // チャンネルメンバーシップは Gateway 側で確認済み（isChannelMember）
    const message = await this.messagesRepository.findById(data.messageId)
    if (!message || message.channelId !== data.channelId) return null

    const result = await this.reactionsService.toggleReaction(
      data.messageId,
      data.channelId,
      data.userId,
      data.emoji,
    )

    // fire-and-forget: 追加時のみ通知（削除時は通知しない）
    if (result.action === 'added') {
      void this.notificationsService.notifyReactionAdded(data.messageId, data.userId)
    }

    return result
  }
}
