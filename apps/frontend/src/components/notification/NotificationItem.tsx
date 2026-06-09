'use client'

import { useRouter, useParams } from 'next/navigation'
import type { Notification } from '@/types/notification'
import { NOTIFICATION_LABELS } from '@/types/notification'
import { useNotificationStore } from '@/stores/notification.store'

type Props = {
  notification: Notification
  onMarkAsRead: (id: string) => void
}

export function NotificationItem({ notification, onMarkAsRead }: Props) {
  const router = useRouter()
  const params = useParams<{ workspaceId?: string }>()
  const { closeDropdown } = useNotificationStore()
  const label = NOTIFICATION_LABELS[notification.type]
  const preview = notification.message?.content?.slice(0, 60)

  const handleClick = () => {
    if (!notification.isRead) onMarkAsRead(notification.id)

    const wsId = notification.workspaceId ?? params.workspaceId
    if (!wsId) {
      closeDropdown()
      return
    }

    if (notification.dmRoomId) {
      router.push(`/${wsId}/dm/${notification.dmRoomId}`)
    } else if (notification.channelId) {
      router.push(`/${wsId}/${notification.channelId}`)
    }

    closeDropdown()
  }

  return (
    <div
      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-blue-50' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-2">
        {!notification.isRead && (
          <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
        )}
        <div className={!notification.isRead ? '' : 'ml-4'}>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {notification.message?.user && (
            <p className="text-xs text-gray-500 mt-0.5">{notification.message.user.displayName}</p>
          )}
          {preview && <p className="text-xs text-gray-600 mt-1 truncate">{preview}</p>}
          {notification.channel && (
            <p className="text-xs text-gray-400 mt-0.5">#{notification.channel.name}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {new Date(notification.createdAt).toLocaleString('ja-JP', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
