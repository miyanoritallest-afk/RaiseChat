'use client'

import { useNotificationStore } from '@/stores/notification.store'
import { NotificationDropdown } from './NotificationDropdown'

export function NotificationBell() {
  const { unreadCount, isDropdownOpen, openDropdown, closeDropdown } = useNotificationStore()

  const handleClick = () => {
    if (isDropdownOpen) {
      closeDropdown()
    } else {
      openDropdown()
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="通知"
        aria-label={`通知${unreadCount > 0 ? `（未読${unreadCount}件）` : ''}`}
      >
        {/* ベルアイコン */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* 未読バッジ */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isDropdownOpen && <NotificationDropdown />}
    </div>
  )
}
