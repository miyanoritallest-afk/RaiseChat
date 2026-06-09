'use client'

import { createPortal } from 'react-dom'
import { useNotifications } from '@/hooks/useNotifications'
import { useNotificationStore } from '@/stores/notification.store'
import { NotificationItem } from './NotificationItem'

export function NotificationDropdown() {
  const { notifications, hasMore, isLoading, loadMore, markAsRead, markAllAsRead } =
    useNotifications()
  const { closeDropdown } = useNotificationStore()

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/40" onClick={closeDropdown} />

      {/* モーダル本体 */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-900">通知</span>
          <div className="flex items-center gap-3">
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              すべて既読
            </button>
            <button
              onClick={closeDropdown}
              className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
          {isLoading && notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">読み込み中...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">通知はありません</div>
          ) : (
            notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onMarkAsRead={markAsRead} />
            ))
          )}

          {hasMore && (
            <div className="px-4 py-3 text-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
              >
                {isLoading ? '読み込み中...' : 'さらに読み込む'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
