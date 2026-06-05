'use client'

import { useEffect, useRef } from 'react'
import { getSocket } from '@/lib/socket/socket.client'
import { useMessageStore } from '@/stores/message.store'
import type { Message } from '@/types/message'

type ReplyCountUpdatedPayload = {
  parentMessageId: string
  replyCount: number
  latestRepliers: Array<{ id: string; displayName: string; avatarUrl: string | null }>
}

export function useSocket(channelId: string, workspaceId: string) {
  const addMessage = useMessageStore((s) => s.addMessage)
  const updateMessage = useMessageStore((s) => s.updateMessage)
  const removeMessage = useMessageStore((s) => s.removeMessage)
  const messages = useMessageStore((s) => s.messages)
  const setMessages = useMessageStore((s) => s.setMessages)
  const nextCursor = useMessageStore((s) => s.nextCursor)
  const hasMore = useMessageStore((s) => s.hasMore)
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

    // スレッド返信があったとき、親メッセージの返信数・返信者を更新
    const onThreadReplyCountUpdated = (payload: ReplyCountUpdatedPayload) => {
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

    socket.on('message:received', onMessageReceived)
    socket.on('message:updated', onMessageUpdated)
    socket.on('message:deleted', onMessageDeleted)
    socket.on('thread:reply_count_updated', onThreadReplyCountUpdated)

    return () => {
      socket.off('message:received', onMessageReceived)
      socket.off('message:updated', onMessageUpdated)
      socket.off('message:deleted', onMessageDeleted)
      socket.off('thread:reply_count_updated', onThreadReplyCountUpdated)
    }
  }, [
    channelId,
    workspaceId,
    addMessage,
    updateMessage,
    removeMessage,
    messages,
    setMessages,
    nextCursor,
    hasMore,
  ])

  return socketRef.current
}
