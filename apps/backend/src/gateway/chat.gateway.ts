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
  server: Server

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
    })

    this.server.to(`channel:${dto.channelId}`).emit('message:received', message)
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
