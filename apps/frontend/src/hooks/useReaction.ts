'use client'

import { getSocket } from '@/lib/socket/socket.client'
import { aggregateReactions } from '@/lib/utils/reaction'
import { useAuthStore } from '@/stores/auth.store'
import { useMessageStore } from '@/stores/message.store'
import type { RawReactionPayload } from '@/lib/api/reaction.api'

/**
 * リアクションのトグル操作をSocket.ioで送信するフック。
 * REST APIは使わず全てWebSocket経由で実行し、reaction:updatedで全員に反映される。
 */
export function useReaction(channelId: string) {
  const user = useAuthStore((s) => s.user)

  const toggle = (messageId: string, emoji: string) => {
    if (!user) return
    const socket = getSocket()
    socket.emit('reaction:toggle', { messageId, channelId, emoji })
  }

  return { toggle }
}

/**
 * reaction:updated ソケットイベントのペイロードをストアに適用するハンドラを返す。
 * useSocket.ts から呼び出すことで、チャンネルページのみでリッスンする。
 */
export function createReactionUpdatedHandler(myUserId: string) {
  return (payload: RawReactionPayload) => {
    const { messages, nextCursor, hasMore, setMessages } = useMessageStore.getState()
    const updatedMessages = messages.map((m) => {
      if (m.id !== payload.messageId) return m
      return {
        ...m,
        reactions: aggregateReactions(payload.reactions, myUserId),
      }
    })
    setMessages(updatedMessages, nextCursor, hasMore)
  }
}
