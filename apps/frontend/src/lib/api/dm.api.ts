import { apiClient } from './client'
import type { DmRoom, DmMessagesResponse, DmMessage } from '@/types/dm'

export const dmApi = {
  getDmRooms: (wsId: string) => apiClient.get<DmRoom[]>(`/workspaces/${wsId}/dm-rooms`),

  createDmRoom: (wsId: string, data: { memberIds: string[]; name?: string }) =>
    apiClient.post<DmRoom>(`/workspaces/${wsId}/dm-rooms`, data),

  getDmMessages: (dmRoomId: string, cursor?: string, limit?: number) => {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', cursor)
    if (limit) params.set('limit', String(limit))
    const query = params.toString()
    return apiClient.get<DmMessagesResponse>(
      `/dm-rooms/${dmRoomId}/messages${query ? `?${query}` : ''}`,
    )
  },

  updateDmMessage: (dmRoomId: string, messageId: string, content: string) =>
    apiClient.patch<DmMessage>(`/dm-rooms/${dmRoomId}/messages/${messageId}`, { content }),

  deleteDmMessage: (dmRoomId: string, messageId: string) =>
    apiClient.delete<void>(`/dm-rooms/${dmRoomId}/messages/${messageId}`),

  updateDmRoom: (dmRoomId: string, name: string) =>
    apiClient.patch<DmRoom>(`/dm-rooms/${dmRoomId}`, { name }),
}
