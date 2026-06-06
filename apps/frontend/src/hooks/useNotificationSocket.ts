'use client'

import { useEffect, useRef } from 'react'
import { getSocket } from '@/lib/socket/socket.client'
import { useNotificationStore } from '@/stores/notification.store'
import { notificationApi } from '@/lib/api/notification.api'

type NotificationReceivedPayload = {
  type: string
  messageId?: string
  dmRoomId?: string
}

/**
 * アプリ全体で1回だけ AppLayout にマウントする。
 * user:${userId} ルームは handleConnection 時にサーバー側で自動 join 済みなので
 * クライアント側の join 操作は不要。
 */
export function useNotificationSocket() {
  const { incrementUnreadCount } = useNotificationStore()
  const socketRef = useRef(getSocket())

  useEffect(() => {
    const socket = socketRef.current

    const onNotificationReceived = (_payload: NotificationReceivedPayload) => {
      incrementUnreadCount()
      // 未読数の正確な値をサーバーから再取得して同期する
      void notificationApi
        .getNotifications(undefined, 1)
        .then(({ unreadCount }) => {
          useNotificationStore.getState().setUnreadCount(unreadCount)
        })
        .catch(() => {})
    }

    socket.on('notification:received', onNotificationReceived)

    return () => {
      socket.off('notification:received', onNotificationReceived)
    }
  }, [incrementUnreadCount])
}
