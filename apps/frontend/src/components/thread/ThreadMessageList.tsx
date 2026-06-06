'use client'

import { useEffect, useRef } from 'react'
import { useThreadStore } from '@/stores/thread.store'
import { ThreadMessageItem } from './ThreadMessageItem'

type Props = {
  wsId: string
  channelId: string
  hasMore: boolean
  isLoading: boolean
  loadMore: () => void
}

export function ThreadMessageList({ wsId, channelId, hasMore, isLoading, loadMore }: Props) {
  const { replies, parentMessage } = useThreadStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  // 新しい返信が届いたら最下部にスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replies.length])

  if (!parentMessage) return null

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {/* 過去の返信を読み込むボタン */}
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

      {/* 親メッセージのプレビュー */}
      <div className="mx-4 mb-3 p-3 bg-gray-50 rounded border-l-2 border-gray-300">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
            {parentMessage.user.displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-gray-700">
            {parentMessage.user.displayName}
          </span>
        </div>
        <p className="text-sm text-gray-700 line-clamp-3">{parentMessage.content}</p>
      </div>

      <div className="border-t border-gray-100 pt-2">
        <p className="px-4 text-xs text-gray-400 mb-2">{replies.length} 件の返信</p>
        {replies.map((reply) => (
          <ThreadMessageItem key={reply.id} reply={reply} wsId={wsId} channelId={channelId} />
        ))}
      </div>

      <div ref={bottomRef} />
    </div>
  )
}
