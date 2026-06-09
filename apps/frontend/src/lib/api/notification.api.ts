import { apiClient } from './client'
import type { NotificationsResponse } from '@/types/notification'

export const notificationApi = {
  getNotifications(cursor?: string, limit = 20): Promise<NotificationsResponse> {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', cursor)
    params.set('limit', String(limit))
    return apiClient.get<NotificationsResponse>(`/notifications?${params.toString()}`)
  },

  markAsRead(notificationId: string): Promise<void> {
    return apiClient.patch<void>(`/notifications/${notificationId}/read`)
  },

  markAllAsRead(): Promise<void> {
    return apiClient.patch<void>('/notifications/read-all')
  },

  markReadByChannel(channelId: string): Promise<void> {
    return apiClient.patch<void>(`/notifications/read-by-channel/${channelId}`)
  },

  markReadByDmRoom(dmRoomId: string): Promise<void> {
    return apiClient.patch<void>(`/notifications/read-by-dm-room/${dmRoomId}`)
  },
}
