'use client'

import { useCallback } from 'react'
import { getSocket } from '@/lib/socket/socket.client'

export function usePins(workspaceId: string, channelId: string) {
  const pin = useCallback(
    (messageId: string) => {
      const socket = getSocket()
      socket.emit('pin:add', { channelId, messageId, workspaceId })
    },
    [channelId, workspaceId],
  )

  const unpin = useCallback(
    (messageId: string) => {
      const socket = getSocket()
      socket.emit('pin:remove', { channelId, messageId, workspaceId })
    },
    [channelId, workspaceId],
  )

  return { pin, unpin }
}
