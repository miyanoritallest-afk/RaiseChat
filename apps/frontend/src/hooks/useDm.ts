'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useDmStore } from '@/stores/dm.store'
import { dmApi } from '@/lib/api/dm.api'

export function useDm(dmRoomId: string) {
  const {
    setMessages,
    prependMessages,
    setCurrentRoom,
    hasMore,
    nextCursor,
    isLoading,
    setLoading,
  } = useDmStore()
  const initializedRef = useRef<string | null>(null)

  useEffect(() => {
    if (initializedRef.current === dmRoomId) return
    initializedRef.current = dmRoomId

    setLoading(true)
    dmApi
      .getDmMessages(dmRoomId)
      .then((res) => setMessages(res.messages, res.nextCursor, res.hasMore))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dmRoomId, setMessages, setLoading])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !nextCursor) return
    setLoading(true)
    try {
      const res = await dmApi.getDmMessages(dmRoomId, nextCursor)
      prependMessages(res.messages, res.nextCursor, res.hasMore)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [hasMore, isLoading, nextCursor, dmRoomId, prependMessages, setLoading])

  return { isLoading, hasMore, loadMore, setCurrentRoom }
}
