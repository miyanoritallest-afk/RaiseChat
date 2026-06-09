'use client'

import type { Pin } from '@/types/pin'

type Props = {
  pin: Pin
  onUnpin: (messageId: string) => void
  onJumpToThread: (messageId: string) => void
}

export function PinnedMessageItem({ pin, onUnpin, onJumpToThread }: Props) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="group px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => onJumpToThread(pin.messageId)} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-xs font-medium text-gray-600">
              {pin.message.user.displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {pin.message.user.displayName}
            </span>
            <span className="text-xs text-gray-400">{formatDate(pin.message.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-800 line-clamp-3 whitespace-pre-wrap break-words">
            {pin.message.content}
          </p>
          <p className="text-xs text-blue-500 mt-1 hover:underline">スレッドを開く →</p>
          <p className="text-xs text-gray-400">ピン留め by {pin.user.displayName}</p>
        </button>
        <button
          onClick={() => onUnpin(pin.messageId)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-opacity"
          title="ピン留めを解除"
        >
          解除
        </button>
      </div>
    </div>
  )
}
