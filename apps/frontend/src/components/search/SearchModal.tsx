'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSearch } from '@/hooks/useSearch'
import type { SearchResultMessage } from '@/types/search'

type Props = {
  wsId: string
  onClose: () => void
}

function SearchResultItem({
  message,
  wsId,
  onClose,
}: {
  message: SearchResultMessage
  wsId: string
  onClose: () => void
}) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/${wsId}/${message.channel.id}`)
    onClose()
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-blue-600">#{message.channel.name}</span>
        <span className="text-xs text-gray-400">
          {new Date(message.createdAt).toLocaleString('ja-JP', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <div className="flex items-start gap-2">
        <span className="text-xs text-gray-500 flex-shrink-0">{message.user.displayName}</span>
        <p className="text-sm text-gray-800 line-clamp-2">{message.content}</p>
      </div>
    </button>
  )
}

export function SearchModal({ wsId, onClose }: Props) {
  const { query, setQuery, results, hasMore, isLoading, error, loadMore, reset } = useSearch(wsId)
  const inputRef = useRef<HTMLInputElement>(null)

  // モーダル表示時にフォーカス
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Escape キーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      onClick={handleClose}
    >
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/40" />

      {/* モーダル本体 */}
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 検索入力 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="メッセージを検索..."
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              クリア
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs text-gray-400 border border-gray-200 rounded">
            Esc
          </kbd>
        </div>

        {/* 検索結果 */}
        <div className="overflow-y-auto flex-1">
          {isLoading && results.length === 0 && (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              検索中...
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12 text-sm text-red-500">
              {error}
            </div>
          )}

          {!isLoading && !error && query.trim().length >= 2 && results.length === 0 && (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              「{query}」に一致するメッセージが見つかりませんでした
            </div>
          )}

          {query.trim().length < 2 && query.length > 0 && (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              2文字以上入力してください
            </div>
          )}

          {query.length === 0 && (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              キーワードを入力してメッセージを検索
            </div>
          )}

          {results.length > 0 && (
            <div>
              {results.map((msg) => (
                <SearchResultItem key={msg.id} message={msg} wsId={wsId} onClose={handleClose} />
              ))}
              {hasMore && (
                <div className="p-3 text-center">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                  >
                    {isLoading ? '読み込み中...' : 'さらに表示'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {results.length}件表示中
            {hasMore ? '（さらにあります）' : '（すべて表示）'}
          </div>
        )}
      </div>
    </div>
  )
}
