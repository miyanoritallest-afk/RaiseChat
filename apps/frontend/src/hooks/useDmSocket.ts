'use client'

import { useEffect, useRef } from 'react'
import { getSocket } from '@/lib/socket/socket.client'
import { useDmStore } from '@/stores/dm.store'
import type { DmMessage } from '@/types/dm'

export function useDmSocket(dmRoomId: string) {
  const addMessage = useDmStore((s) => s.addMessage)
  const updateMessage = useDmStore((s) => s.updateMessage)
  const removeMessage = useDmStore((s) => s.removeMessage)
  const socketRef = useRef(getSocket())

  useEffect(() => {
    const socket = socketRef.current

    socket.emit('dm:join', { dmRoomId })

    const onDmReceived = (msg: DmMessage) => addMessage(msg)
    const onDmUpdated = (msg: DmMessage) => updateMessage(msg)
    const onDmDeleted = ({ messageId }: { messageId: string }) => removeMessage(messageId)

    socket.on('dm:received', onDmReceived)
    socket.on('dm:updated', onDmUpdated)
    socket.on('dm:deleted', onDmDeleted)

    return () => {
      // DM部屋を離脱してSocket.ioルームから抜ける
      socket.emit('dm:leave', { dmRoomId })
      socket.off('dm:received', onDmReceived)
      socket.off('dm:updated', onDmUpdated)
      socket.off('dm:deleted', onDmDeleted)
    }
  }, [dmRoomId, addMessage, updateMessage, removeMessage])

  return socketRef.current
}
