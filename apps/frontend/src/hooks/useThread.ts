'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useThreadStore } from '@/stores/thread.store'
import { threadApi } from '@/lib/api/thread.api'
import { getSocket } from '@/lib/socket/socket.client'
import type { ThreadReply } from '@/types/thread'

export function useThread(wsId: string, channelId: string) {
  const {
    parentMessage,
    isOpen,
    setReplies,
    appendReplies,
    addReply,
    updateReply,
    removeReply,
    hasMore,
    nextCursor,
    isLoading,
    setLoading,
  } = useThreadStore()
  const socketRef = useRef(getSocket())

  // 親メッセージが変わるたびに返信一覧を初期取得
  useEffect(() => {
    if (!parentMessage) return

    setLoading(true)
    threadApi
      .getReplies(wsId, channelId, parentMessage.id)
      .then((res) => setReplies(res.replies, res.nextCursor, res.hasMore))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [wsId, channelId, parentMessage?.id, setReplies, setLoading])

  // Socket.io でスレッド内のリアルタイム更新を購読
  // スレッド返信は通常の message:received と同じイベントを使う（threadId で区別）
  useEffect(() => {
    const socket = socketRef.current
    if (!isOpen || !parentMessage) return

    const onMessageReceived = (msg: ThreadReply) => {
      if (msg.threadId === parentMessage.id) {
        addReply(msg)
      }
    }
    const onMessageUpdated = (msg: ThreadReply) => {
      if (msg.threadId === parentMessage.id) {
        updateReply(msg)
      }
    }
    const onMessageDeleted = ({ messageId }: { messageId: string }) => {
      removeReply(messageId)
    }

    socket.on('message:received', onMessageReceived)
    socket.on('message:updated', onMessageUpdated)
    socket.on('message:deleted', onMessageDeleted)

    return () => {
      socket.off('message:received', onMessageReceived)
      socket.off('message:updated', onMessageUpdated)
      socket.off('message:deleted', onMessageDeleted)
    }
  }, [isOpen, parentMessage?.id, addReply, updateReply, removeReply])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !nextCursor || !parentMessage) return
    setLoading(true)
    try {
      const res = await threadApi.getReplies(wsId, channelId, parentMessage.id, nextCursor)
      appendReplies(res.replies, res.nextCursor, res.hasMore)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [
    hasMore,
    isLoading,
    nextCursor,
    wsId,
    channelId,
    parentMessage?.id,
    appendReplies,
    setLoading,
  ])

  return { isLoading, hasMore, loadMore }
}
