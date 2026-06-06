import type { MessageReaction } from '@/types/message'

/** サーバーから届く raw リアクション ({ emoji, userIds[] }) を表示用に変換する */
export function aggregateReactions(
  rawReactions: { emoji: string; userIds: string[] }[],
  myUserId: string,
): MessageReaction[] {
  return rawReactions.map(({ emoji, userIds }) => ({
    emoji,
    count: userIds.length,
    hasMe: userIds.includes(myUserId),
  }))
}
