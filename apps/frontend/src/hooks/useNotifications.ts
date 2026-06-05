'use client'

import { useCallback, useEffect } from 'react'
import { useNotificationStore } from '@/stores/notification.store'
import { notificationApi } from '@/lib/api/notification.api'

export function useNotifications() {
  const {
    notifications,
    unreadCount,
    nextCursor,
    hasMore,
    isLoading,
    setNotifications,
    setIsLoading,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore()

  useEffect(() => {
    setIsLoading(true)
    notificationApi
      .getNotifications()
      .then(({ notifications: items, nextCursor: cursor, hasMore: more, unreadCount: count }) => {
        setNotifications(items, cursor, more, count)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [setNotifications, setIsLoading])

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || !nextCursor) return
    setIsLoading(true)
    notificationApi
      .getNotifications(nextCursor)
      .then(({ notifications: items, nextCursor: cursor, hasMore: more, unreadCount: count }) => {
        setNotifications([...notifications, ...items], cursor, more, count)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [hasMore, isLoading, nextCursor, notifications, setNotifications, setIsLoading])

  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      markAsRead(notificationId)
      void notificationApi.markAsRead(notificationId)
    },
    [markAsRead],
  )

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead()
    void notificationApi.markAllAsRead()
  }, [markAllAsRead])

  return {
    notifications,
    unreadCount,
    hasMore,
    isLoading,
    loadMore,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
  }
}
