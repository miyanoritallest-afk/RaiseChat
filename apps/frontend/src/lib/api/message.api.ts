import { apiClient } from './client'
import type { Message, MessagesResponse } from '@/types/message'

export const messageApi = {
  getMessages: (wsId: string, channelId: string, cursor?: string, limit?: number) => {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', cursor)
    if (limit) params.set('limit', String(limit))
    const query = params.toString()
    return apiClient.get<MessagesResponse>(
      `/workspaces/${wsId}/channels/${channelId}/messages${query ? `?${query}` : ''}`,
    )
  },

  createMessage: (wsId: string, channelId: string, data: { content: string; threadId?: string }) =>
    apiClient.post<Message>(`/workspaces/${wsId}/channels/${channelId}/messages`, data),

  updateMessage: (wsId: string, channelId: string, messageId: string, content: string) =>
    apiClient.patch<Message>(`/workspaces/${wsId}/channels/${channelId}/messages/${messageId}`, {
      content,
    }),

  deleteMessage: (wsId: string, channelId: string, messageId: string) =>
    apiClient.delete<void>(`/workspaces/${wsId}/channels/${channelId}/messages/${messageId}`),
}
