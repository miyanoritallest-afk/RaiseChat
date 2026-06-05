'use client'

import { useEffect, useRef } from 'react'
import { getSocket } from '@/lib/socket/socket.client'
import { useMessageStore } from '@/stores/message.store'
import type { Message } from '@/types/message'

export function useSocket(channelId: string, workspaceId: string) {
  const addMessage = useMessageStore((s) => s.addMessage)
  const updateMessage = useMessageStore((s) => s.updateMessage)
  const removeMessage = useMessageStore((s) => s.removeMessage)
  const socketRef = useRef(getSocket())

  useEffect(() => {
    const socket = socketRef.current

    socket.emit('workspace:join', { workspaceId })
    socket.emit('channel:join', { channelId })

    const onMessageReceived = (msg: Message) => addMessage(msg)
    const onMessageUpdated = (msg: Message) => updateMessage(msg)
    const onMessageDeleted = ({ messageId }: { messageId: string }) => removeMessage(messageId)

    socket.on('message:received', onMessageReceived)
    socket.on('message:updated', onMessageUpdated)
    socket.on('message:deleted', onMessageDeleted)

    return () => {
      socket.off('message:received', onMessageReceived)
      socket.off('message:updated', onMessageUpdated)
      socket.off('message:deleted', onMessageDeleted)
    }
  }, [channelId, workspaceId, addMessage, updateMessage, removeMessage])

  return socketRef.current
}
