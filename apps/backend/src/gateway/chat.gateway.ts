import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets'
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Server, Socket } from 'socket.io'
import { WsExceptionFilter } from '../common/filters/ws-exception.filter'
import { GatewayService } from './gateway.service'
import { WsWorkspaceJoinDto } from './dto/ws-workspace-join.dto'
import { WsChannelJoinDto } from './dto/ws-channel-join.dto'
import { WsMessageSendDto } from './dto/ws-message-send.dto'
import { WsMessageEditDto } from './dto/ws-message-edit.dto'
import { WsMessageDeleteDto } from './dto/ws-message-delete.dto'
import { WsDmJoinDto } from './dto/ws-dm-join.dto'
import { WsDmMessageSendDto } from './dto/ws-dm-message-send.dto'
import { WsDmMessageEditDto } from './dto/ws-dm-message-edit.dto'
import { WsDmMessageDeleteDto } from './dto/ws-dm-message-delete.dto'
import { WsReactionToggleDto } from './dto/ws-reaction-toggle.dto'
import { WsPinAddDto } from './dto/ws-pin-add.dto'
import { WsPinRemoveDto } from './dto/ws-pin-remove.dto'

type AuthenticatedSocket = Socket & { userId: string; username: string }

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
@UseFilters(WsExceptionFilter)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  constructor(
    private readonly jwtService: JwtService,
    private readonly gatewayService: GatewayService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const raw = client.handshake.auth?.token as string | undefined
      const token = raw?.replace('Bearer ', '')
      if (!token) throw new Error('token missing')

      const payload = this.jwtService.verify<{ sub: string; username: string }>(token)
      ;(client as AuthenticatedSocket).userId = payload.sub
      ;(client as AuthenticatedSocket).username = payload.username

      await this.gatewayService.setUserOnline(payload.sub)

      // 通知のためにユーザー個別ルームに join させる
      await client.join(`user:${payload.sub}`)
    } catch {
      client.disconnect(true)
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (!client.userId) return
    await this.gatewayService.setUserOffline(client.userId)

    const workspaceIds = await this.gatewayService.getUserWorkspaceIds(client.userId)
    for (const wsId of workspaceIds) {
      this.server.to(`workspace:${wsId}`).emit('presence:updated', {
        userId: client.userId,
        status: 'OFFLINE',
      })
    }
  }

  @SubscribeMessage('workspace:join')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleWorkspaceJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsWorkspaceJoinDto,
  ) {
    const isMember = await this.gatewayService.isWorkspaceMember(client.userId, dto.workspaceId)
    if (!isMember) throw new WsException('このワークスペースへのアクセス権限がありません')

    await client.join(`workspace:${dto.workspaceId}`)
    this.server.to(`workspace:${dto.workspaceId}`).emit('presence:updated', {
      userId: client.userId,
      status: 'ONLINE',
    })
  }

  @SubscribeMessage('channel:join')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleChannelJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsChannelJoinDto,
  ) {
    const isMember = await this.gatewayService.isChannelMember(client.userId, dto.channelId)
    if (!isMember) throw new WsException('このチャンネルへのアクセス権限がありません')

    await client.join(`channel:${dto.channelId}`)
  }

  @SubscribeMessage('message:send')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleMessageSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsMessageSendDto,
  ) {
    const isMember = await this.gatewayService.isChannelMember(client.userId, dto.channelId)
    if (!isMember) throw new WsException('このチャンネルへのアクセス権限がありません')

    const message = await this.gatewayService.createMessage({
      channelId: dto.channelId,
      userId: client.userId,
      content: dto.content,
      threadId: dto.threadId,
      attachments: dto.attachments,
    })

    this.server.to(`channel:${dto.channelId}`).emit('message:received', message)

    // スレッド返信の場合、親メッセージの返信数更新をチャンネル全員に通知
    if (dto.threadId) {
      const parent = await this.gatewayService.getMessageById(dto.threadId)
      if (parent) {
        this.server.to(`channel:${dto.channelId}`).emit('thread:reply_count_updated', {
          parentMessageId: dto.threadId,
          replyCount: parent._count.replies,
          latestRepliers: parent.replies.map((r: { user: unknown }) => r.user),
        })
        // スレッド返信の通知を親メッセージ投稿者に送信
        this.server
          .to(`user:${parent.userId}`)
          .emit('notification:received', { type: 'THREAD_REPLY', messageId: message.id })
      }
    }

    // @メンション対象ユーザーに通知を送信
    const mentionTargets = await this.gatewayService.getMentionTargetUserIds(
      dto.content,
      dto.channelId,
      client.userId,
    )
    for (const userId of mentionTargets) {
      this.server
        .to(`user:${userId}`)
        .emit('notification:received', { type: 'MENTION', messageId: message.id })
    }
  }

  @SubscribeMessage('message:edit')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleMessageEdit(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsMessageEditDto,
  ) {
    const message = await this.gatewayService.updateMessage({
      messageId: dto.messageId,
      userId: client.userId,
      content: dto.content,
    })
    if (!message) throw new WsException('メッセージを編集する権限がありません')

    this.server.to(`channel:${message.channelId}`).emit('message:updated', message)
  }

  @SubscribeMessage('message:delete')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleMessageDelete(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsMessageDeleteDto,
  ) {
    const result = await this.gatewayService.deleteMessage({
      messageId: dto.messageId,
      userId: client.userId,
    })
    if (!result) throw new WsException('メッセージを削除する権限がありません')

    this.server
      .to(`channel:${result.channelId}`)
      .emit('message:deleted', { messageId: result.id, channelId: result.channelId })
  }

  // --- DM ハンドラ ---
  // 全 dm:* ハンドラで isDmRoomMember を呼び IDOR を防止する

  @SubscribeMessage('dm:join')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleDmJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsDmJoinDto,
  ) {
    const isMember = await this.gatewayService.isDmRoomMember(client.userId, dto.dmRoomId)
    if (!isMember) throw new WsException('このDMへのアクセス権限がありません')
    await client.join(`dm:${dto.dmRoomId}`)
  }

  @SubscribeMessage('dm:leave')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleDmLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsDmJoinDto,
  ) {
    await client.leave(`dm:${dto.dmRoomId}`)
  }

  @SubscribeMessage('dm:send')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleDmSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsDmMessageSendDto,
  ) {
    const isMember = await this.gatewayService.isDmRoomMember(client.userId, dto.dmRoomId)
    if (!isMember) throw new WsException('このDMへのアクセス権限がありません')

    const message = await this.gatewayService.createDmMessage({
      dmRoomId: dto.dmRoomId,
      userId: client.userId,
      content: dto.content,
    })

    this.server.to(`dm:${dto.dmRoomId}`).emit('dm:received', message)

    // DM未読通知をルーム内の他メンバーに送信（user:X ルームを使ってリアルタイム通知）
    const dmMemberIds = await this.gatewayService.getDmRoomMemberIds(dto.dmRoomId, client.userId)
    for (const userId of dmMemberIds) {
      this.server
        .to(`user:${userId}`)
        .emit('notification:received', { type: 'UNREAD', dmRoomId: dto.dmRoomId })
    }
  }

  @SubscribeMessage('dm:edit')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleDmEdit(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsDmMessageEditDto,
  ) {
    const isMember = await this.gatewayService.isDmRoomMember(client.userId, dto.dmRoomId)
    if (!isMember) throw new WsException('このDMへのアクセス権限がありません')

    const message = await this.gatewayService.updateDmMessage({
      messageId: dto.messageId,
      dmRoomId: dto.dmRoomId,
      userId: client.userId,
      content: dto.content,
    })
    if (!message) throw new WsException('このメッセージを編集する権限がありません')

    this.server.to(`dm:${dto.dmRoomId}`).emit('dm:updated', message)
  }

  @SubscribeMessage('dm:delete')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleDmDelete(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsDmMessageDeleteDto,
  ) {
    const isMember = await this.gatewayService.isDmRoomMember(client.userId, dto.dmRoomId)
    if (!isMember) throw new WsException('このDMへのアクセス権限がありません')

    const result = await this.gatewayService.deleteDmMessage({
      messageId: dto.messageId,
      dmRoomId: dto.dmRoomId,
      userId: client.userId,
    })
    if (!result) throw new WsException('このメッセージを削除する権限がありません')

    this.server.to(`dm:${dto.dmRoomId}`).emit('dm:deleted', {
      messageId: result.id,
      dmRoomId: result.dmRoomId,
    })
  }

  @SubscribeMessage('reaction:toggle')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handleReactionToggle(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsReactionToggleDto,
  ) {
    const isMember = await this.gatewayService.isChannelMember(client.userId, dto.channelId)
    if (!isMember) throw new WsException('このチャンネルへのアクセス権限がありません')

    const result = await this.gatewayService.toggleReaction({
      messageId: dto.messageId,
      channelId: dto.channelId,
      userId: client.userId,
      emoji: dto.emoji,
    })
    if (!result) throw new WsException('メッセージが見つかりません')

    this.server.to(`channel:${dto.channelId}`).emit('reaction:updated', result)
  }

  @SubscribeMessage('pin:add')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handlePinAdd(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsPinAddDto,
  ) {
    const isMember = await this.gatewayService.isChannelMember(client.userId, dto.channelId)
    if (!isMember) throw new WsException('このチャンネルへのアクセス権限がありません')

    const pin = await this.gatewayService.addPin({
      messageId: dto.messageId,
      channelId: dto.channelId,
      userId: client.userId,
    })

    this.server.to(`channel:${dto.channelId}`).emit('pin:updated', { action: 'add', pin })
  }

  @SubscribeMessage('pin:remove')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async handlePinRemove(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsPinRemoveDto,
  ) {
    const isMember = await this.gatewayService.isChannelMember(client.userId, dto.channelId)
    if (!isMember) throw new WsException('このチャンネルへのアクセス権限がありません')

    const result = await this.gatewayService.removePin({
      messageId: dto.messageId,
      channelId: dto.channelId,
      userId: client.userId,
    })

    this.server
      .to(`channel:${dto.channelId}`)
      .emit('pin:updated', { action: 'remove', pin: { id: result.id, messageId: dto.messageId } })
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsChannelJoinDto,
  ) {
    client.to(`channel:${dto.channelId}`).emit('typing:updated', {
      channelId: dto.channelId,
      userId: client.userId,
      username: client.username,
      isTyping: true,
    })
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: WsChannelJoinDto,
  ) {
    client.to(`channel:${dto.channelId}`).emit('typing:updated', {
      channelId: dto.channelId,
      userId: client.userId,
      username: client.username,
      isTyping: false,
    })
  }
}
