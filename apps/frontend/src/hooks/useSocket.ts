'use client'

import { useEffect, useRef } from 'react'
import { getSocket } from '@/lib/socket/socket.client'
import { useMessageStore } from '@/stores/message.store'
import { useAuthStore } from '@/stores/auth.store'
import { createReactionUpdatedHandler } from '@/hooks/useReaction'
import type { Message } from '@/types/message'
import type { RawReactionPayload } from '@/lib/api/reaction.api'

type ReplyCountUpdatedPayload = {
  parentMessageId: string
  replyCount: number
  latestRepliers: Array<{ id: string; displayName: string; avatarUrl: string | null }>
}

export function useSocket(channelId: string, workspaceId: string) {
  const addMessage = useMessageStore((s) => s.addMessage)
  const updateMessage = useMessageStore((s) => s.updateMessage)
  const removeMessage = useMessageStore((s) => s.removeMessage)
  const myUserId = useAuthStore((s) => s.user?.id ?? '')
  const socketRef = useRef(getSocket())

  useEffect(() => {
    const socket = socketRef.current

    socket.emit('workspace:join', { workspaceId })
    socket.emit('channel:join', { channelId })

    const onMessageReceived = (msg: Message) => {
      // スレッド返信（threadId あり）はチャンネルタイムラインに追加しない
      if (!msg.threadId) {
        addMessage(msg)
      }
    }
    const onMessageUpdated = (msg: Message) => updateMessage(msg)
    const onMessageDeleted = ({ messageId }: { messageId: string }) => removeMessage(messageId)

    // スレッド返信があったとき、親メッセージの返信数・返信者を更新。
    // getState() で最新状態を参照することで messages を依存配列から除外し、
    // メッセージ受信のたびに effect が再実行される自己強化ループを防ぐ。
    const onThreadReplyCountUpdated = (payload: ReplyCountUpdatedPayload) => {
      const { messages, nextCursor, hasMore, setMessages } = useMessageStore.getState()
      const updatedMessages = messages.map((m) => {
        if (m.id !== payload.parentMessageId) return m
        return {
          ...m,
          _count: { replies: payload.replyCount },
          replies: payload.latestRepliers.map((u) => ({ user: u })),
        }
      })
      setMessages(updatedMessages, nextCursor, hasMore)
    }

    // reaction:updated: チャンネル全員のリアクション表示を同期する
    const onReactionUpdated = createReactionUpdatedHandler(myUserId)

    socket.on('message:received', onMessageReceived)
    socket.on('message:updated', onMessageUpdated)
    socket.on('message:deleted', onMessageDeleted)
    socket.on('thread:reply_count_updated', onThreadReplyCountUpdated)
    socket.on('reaction:updated', onReactionUpdated as (payload: RawReactionPayload) => void)

    return () => {
      socket.off('message:received', onMessageReceived)
      socket.off('message:updated', onMessageUpdated)
      socket.off('message:deleted', onMessageDeleted)
      socket.off('thread:reply_count_updated', onThreadReplyCountUpdated)
      socket.off('reaction:updated', onReactionUpdated as (payload: RawReactionPayload) => void)
    }
  }, [channelId, workspaceId, addMessage, updateMessage, removeMessage, myUserId])

  return socketRef.current
}
