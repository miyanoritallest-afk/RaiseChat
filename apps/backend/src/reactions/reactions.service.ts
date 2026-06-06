import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { ReactionsRepository } from './reactions.repository'
import { MessagesRepository } from '../messages/messages.repository'

@Injectable()
export class ReactionsService {
  constructor(
    private readonly reactionsRepository: ReactionsRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  /**
   * リアクションをトグル（追加済みなら削除、なければ追加）する。
   * 戻り値: そのメッセージの全リアクション一覧 { emoji, userIds[] }
   * フロントエンドがこのリストから hasMe を自己算出する。
   */
  async toggleReaction(
    messageId: string,
    channelId: string,
    userId: string,
    emoji: string,
  ): Promise<{ messageId: string; reactions: { emoji: string; userIds: string[] }[] }> {
    // Layer2 IDOR: メッセージが指定チャンネルに属するかクロスチェック
    const message = await this.messagesRepository.findById(messageId)
    if (!message || message.channelId !== channelId) {
      throw new HttpException('メッセージが見つかりません', HttpStatus.NOT_FOUND)
    }

    const existing = await this.reactionsRepository.findOne(messageId, userId, emoji)
    if (existing) {
      await this.reactionsRepository.delete(messageId, userId, emoji)
    } else {
      await this.reactionsRepository.create(messageId, userId, emoji)
    }

    const all = await this.reactionsRepository.findByMessageId(messageId)
    return { messageId, reactions: aggregateByEmoji(all) }
  }

  /** Gateway から Socket ブロードキャスト用に現在のリアクション一覧を取得する */
  async getReactionsByMessageId(
    messageId: string,
  ): Promise<{ messageId: string; reactions: { emoji: string; userIds: string[] }[] }> {
    const all = await this.reactionsRepository.findByMessageId(messageId)
    return { messageId, reactions: aggregateByEmoji(all) }
  }
}

function aggregateByEmoji(
  reactions: { emoji: string; userId: string }[],
): { emoji: string; userIds: string[] }[] {
  const map = new Map<string, string[]>()
  for (const r of reactions) {
    const users = map.get(r.emoji) ?? []
    users.push(r.userId)
    map.set(r.emoji, users)
  }
  return Array.from(map.entries()).map(([emoji, userIds]) => ({ emoji, userIds }))
}
