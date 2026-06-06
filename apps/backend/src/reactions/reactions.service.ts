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
   * 戻り値に action を含め、追加か削除かを呼び出し元が判定できるようにする。
   * 競合状態（ダブルクリック等）は P2002/P2025 をキャッチして冪等に扱う。
   */
  async toggleReaction(
    messageId: string,
    channelId: string,
    userId: string,
    emoji: string,
  ): Promise<{
    messageId: string
    reactions: { emoji: string; userIds: string[] }[]
    action: 'added' | 'removed'
  }> {
    // Layer2 IDOR: メッセージが指定チャンネルに属するかクロスチェック
    const message = await this.messagesRepository.findById(messageId)
    if (!message || message.channelId !== channelId) {
      throw new HttpException('メッセージが見つかりません', HttpStatus.NOT_FOUND)
    }

    const existing = await this.reactionsRepository.findOne(messageId, userId, emoji)
    let action: 'added' | 'removed'

    try {
      if (existing) {
        await this.reactionsRepository.delete(messageId, userId, emoji)
        action = 'removed'
      } else {
        await this.reactionsRepository.create(messageId, userId, emoji)
        action = 'added'
      }
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code
      // P2002: 競合による重複作成、P2025: 競合による重複削除 — 冪等に扱う
      if (code !== 'P2002' && code !== 'P2025') throw e
      action = code === 'P2002' ? 'added' : 'removed'
    }

    const all = await this.reactionsRepository.findByMessageId(messageId)
    return { messageId, reactions: aggregateByEmoji(all), action }
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
