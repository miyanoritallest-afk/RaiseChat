'use client'

import { useThreadStore } from '@/stores/thread.store'

export function ThreadHeader() {
  const { parentMessage, closeThread } = useThreadStore()

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <div>
        <h2 className="font-semibold text-gray-900">スレッド</h2>
        {parentMessage && (
          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-48">
            {parentMessage.user.displayName} のメッセージ
          </p>
        )}
      </div>
      <button
        onClick={closeThread}
        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        aria-label="スレッドを閉じる"
      >
        ✕
      </button>
    </div>
  )
}
