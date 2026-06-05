import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { MessagesRepository } from './messages.repository'
import { WorkspacesRepository } from '../workspaces/workspaces.repository'
import { ChannelsRepository } from '../channels/channels.repository'
import { CreateMessageDto } from './dto/create-message.dto'
import { UpdateMessageDto } from './dto/update-message.dto'
import { GetMessagesDto } from './dto/get-messages.dto'

type AggregatedReaction = { emoji: string; count: number; hasMe: boolean }

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly workspacesRepository: WorkspacesRepository,
    private readonly channelsRepository: ChannelsRepository,
  ) {}

  async getMessages(channelId: string, userId: string, dto: GetMessagesDto) {
    const limit = dto.limit ?? 50
    const rows = await this.messagesRepository.findManyByChannelId(channelId, dto.cursor, limit)

    const hasMore = rows.length > limit
    const messages = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? messages[messages.length - 1].id : null

    return {
      messages: messages.map((msg) => ({
        ...msg,
        reactions: this.aggregateReactions(msg.reactions, userId),
      })),
      nextCursor,
      hasMore,
    }
  }

  async getReplies(parentMessageId: string, userId: string, dto: GetMessagesDto) {
    const limit = dto.limit ?? 50
    const rows = await this.messagesRepository.findRepliesByMessageId(
      parentMessageId,
      dto.cursor,
      limit,
    )

    const hasMore = rows.length > limit
    const replies = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? replies[replies.length - 1].id : null

    return {
      replies: replies.map((msg) => ({
        ...msg,
        reactions: this.aggregateReactions(msg.reactions, userId),
      })),
      nextCursor,
      hasMore,
    }
  }

  async createMessage(channelId: string, userId: string, dto: CreateMessageDto) {
    const message = await this.messagesRepository.create(channelId, userId, dto)
    return {
      ...message,
      reactions: [],
    }
  }

  async updateMessage(messageId: string, channelId: string, userId: string, dto: UpdateMessageDto) {
    const message = await this.messagesRepository.findById(messageId)
    if (!message || message.channelId !== channelId) {
      throw new HttpException('メッセージが見つかりません', HttpStatus.NOT_FOUND)
    }

    const isAuthor = message.userId === userId
    // isOwner はメッセージが実際に属するワークスペースで確認する
    const channel = await this.channelsRepository.findById(channelId)
    const isOwner = channel
      ? await this.workspacesRepository.isOwner(userId, channel.workspaceId)
      : false

    if (!isAuthor && !isOwner) {
      throw new HttpException('このメッセージを編集する権限がありません', HttpStatus.FORBIDDEN)
    }

    const updated = await this.messagesRepository.update(messageId, dto.content)
    return {
      ...updated,
      reactions: this.aggregateReactions(updated.reactions, userId),
    }
  }

  async deleteMessage(messageId: string, channelId: string, userId: string) {
    const message = await this.messagesRepository.findById(messageId)
    if (!message || message.channelId !== channelId) {
      throw new HttpException('メッセージが見つかりません', HttpStatus.NOT_FOUND)
    }

    const isAuthor = message.userId === userId
    const channel = await this.channelsRepository.findById(channelId)
    const isOwner = channel
      ? await this.workspacesRepository.isOwner(userId, channel.workspaceId)
      : false

    if (!isAuthor && !isOwner) {
      throw new HttpException('このメッセージを削除する権限がありません', HttpStatus.FORBIDDEN)
    }

    return this.messagesRepository.softDelete(messageId)
  }

  private aggregateReactions(
    reactions: { emoji: string; userId: string }[],
    myUserId: string,
  ): AggregatedReaction[] {
    const map = new Map<string, { count: number; hasMe: boolean }>()
    for (const r of reactions) {
      const cur = map.get(r.emoji) ?? { count: 0, hasMe: false }
      map.set(r.emoji, { count: cur.count + 1, hasMe: cur.hasMe || r.userId === myUserId })
    }
    return Array.from(map.entries()).map(([emoji, data]) => ({ emoji, ...data }))
  }
}
