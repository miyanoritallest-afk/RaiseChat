'use client'

import { useEffect, useRef } from 'react'
import { useDmStore } from '@/stores/dm.store'
import { DmMessageItem } from './DmMessageItem'

type Props = {
  hasMore: boolean
  isLoading: boolean
  loadMore: () => void
}

export function DmMessageList({ hasMore, isLoading, loadMore }: Props) {
  const { messages } = useDmStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const newestMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    const newestId = messages[0]?.id ?? null
    if (newestId !== newestMessageIdRef.current) {
      newestMessageIdRef.current = newestId
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const displayMessages = [...messages].reverse()

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {hasMore && (
        <div className="flex justify-center py-2">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
          >
            {isLoading ? '読み込み中...' : 'さらに読み込む'}
          </button>
        </div>
      )}

      {displayMessages.map((msg) => (
        <DmMessageItem key={msg.id} message={msg} />
      ))}

      <div ref={bottomRef} />
    </div>
  )
}
