'use client'

import { useEffect, useRef } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { useNotificationStore } from '@/stores/notification.store'
import { NotificationItem } from './NotificationItem'

type Props = {
  top: number
  right: number
}

export function NotificationDropdown({ top, right }: Props) {
  const { notifications, hasMore, isLoading, loadMore, markAsRead, markAllAsRead } =
    useNotifications()
  const { closeDropdown } = useNotificationStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [closeDropdown])

  return (
    <div
      ref={ref}
      style={{ top, right }}
      className="fixed w-80 max-w-[calc(100vw-1rem)] bg-white rounded-lg shadow-xl border border-gray-200 z-[9999]"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-900">通知</span>
        <button
          onClick={markAllAsRead}
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          すべて既読
        </button>
      </div>

      <div className="max-h-[calc(100vh-8rem)] overflow-y-auto divide-y divide-gray-100">
        {isLoading && notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">読み込み中...</div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">通知はありません</div>
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
  )
}
