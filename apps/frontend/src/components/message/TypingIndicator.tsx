'use client'

import { useEffect, useState } from 'react'
import type { Socket } from 'socket.io-client'

type TypingUser = {
  userId: string
  username: string
}

type TypingUpdatedPayload = {
  channelId: string
  userId: string
  username: string
  isTyping: boolean
}

type Props = {
  socket: Socket
  channelId: string
  currentUserId: string
}

export function TypingIndicator({ socket, channelId, currentUserId }: Props) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])

  useEffect(() => {
    const onTypingUpdated = (payload: TypingUpdatedPayload) => {
      if (payload.channelId !== channelId) return
      if (payload.userId === currentUserId) return

      setTypingUsers((prev) => {
        if (payload.isTyping) {
          const exists = prev.some((u) => u.userId === payload.userId)
          if (exists) return prev
          return [...prev, { userId: payload.userId, username: payload.username }]
        } else {
          return prev.filter((u) => u.userId !== payload.userId)
        }
      })
    }

    socket.on('typing:updated', onTypingUpdated)
    return () => {
      socket.off('typing:updated', onTypingUpdated)
    }
  }, [socket, channelId, currentUserId])

  if (typingUsers.length === 0) return null

  const text =
    typingUsers.length === 1
      ? `${typingUsers[0].username} が入力中...`
      : `${typingUsers.map((u) => u.username).join(', ')} が入力中...`

  return <div className="px-4 pb-1 text-xs text-gray-400 italic h-4">{text}</div>
}
