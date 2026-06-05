'use client'

import { useCallback, useRef } from 'react'
import type { Socket } from 'socket.io-client'

export function useTyping(socket: Socket, channelId: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit('typing:start', { channelId })
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      isTypingRef.current = false
      socket.emit('typing:stop', { channelId })
    }, 2000)
  }, [socket, channelId])

  const stopTyping = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (isTypingRef.current) {
      isTypingRef.current = false
      socket.emit('typing:stop', { channelId })
    }
  }, [socket, channelId])

  return { startTyping, stopTyping }
}
