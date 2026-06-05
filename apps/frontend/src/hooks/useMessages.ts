'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useMessageStore } from '@/stores/message.store'
import { messageApi } from '@/lib/api/message.api'

export function useMessages(wsId: string, channelId: string) {
  const { setMessages, prependMessages, hasMore, nextCursor, isLoading, setLoading } =
    useMessageStore()
  const initializedRef = useRef<string | null>(null)

  useEffect(() => {
    if (initializedRef.current === channelId) return
    initializedRef.current = channelId

    setLoading(true)
    messageApi
      .getMessages(wsId, channelId)
      .then((res) => setMessages(res.messages, res.nextCursor, res.hasMore))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [wsId, channelId, setMessages, setLoading])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !nextCursor) return
    setLoading(true)
    try {
      const res = await messageApi.getMessages(wsId, channelId, nextCursor)
      prependMessages(res.messages, res.nextCursor, res.hasMore)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [hasMore, isLoading, nextCursor, wsId, channelId, prependMessages, setLoading])

  return { isLoading, hasMore, loadMore }
}
