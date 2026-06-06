'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { searchApi } from '@/lib/api/search.api'
import type { SearchResultMessage } from '@/types/search'

export function useSearch(wsId: string) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultMessage[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(
    async (q: string, cursor?: string) => {
      if (q.trim().length < 2) {
        setResults([])
        setNextCursor(null)
        setHasMore(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const res = await searchApi.searchMessages(wsId, q.trim(), cursor)
        if (cursor) {
          setResults((prev) => [...prev, ...res.messages])
        } else {
          setResults(res.messages)
        }
        setNextCursor(res.nextCursor)
        setHasMore(res.hasMore)
      } catch (e) {
        setError(e instanceof Error ? e.message : '検索に失敗しました')
      } finally {
        setIsLoading(false)
      }
    },
    [wsId],
  )

  // クエリ変更時に 300ms デバウンスで検索実行
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      setNextCursor(null)
      setHasMore(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      void search(query)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  const loadMore = useCallback(() => {
    if (nextCursor && !isLoading) void search(query, nextCursor)
  }, [nextCursor, isLoading, query, search])

  const reset = useCallback(() => {
    setQuery('')
    setResults([])
    setNextCursor(null)
    setHasMore(false)
    setError(null)
  }, [])

  return { query, setQuery, results, hasMore, isLoading, error, loadMore, reset }
}
