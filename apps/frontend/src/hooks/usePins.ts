'use client'

import { useCallback } from 'react'
import { getSocket } from '@/lib/socket/socket.client'

export function usePins(channelId: string) {
  const pin = useCallback(
    (messageId: string) => {
      const socket = getSocket()
      socket.emit('pin:add', { channelId, messageId })
    },
    [channelId],
  )

  const unpin = useCallback(
    (messageId: string) => {
      const socket = getSocket()
      socket.emit('pin:remove', { channelId, messageId })
    },
    [channelId],
  )

  return { pin, unpin }
}
