import { apiClient } from './client'
import type { Channel } from '@/types/channel'

export const channelApi = {
  getChannels: (wsId: string) => apiClient.get<Channel[]>(`/workspaces/${wsId}/channels`),

  getChannel: (wsId: string, channelId: string) =>
    apiClient.get<Channel>(`/workspaces/${wsId}/channels/${channelId}`),

  createChannel: (
    wsId: string,
    data: { name: string; isPrivate?: boolean; description?: string },
  ) => apiClient.post<Channel>(`/workspaces/${wsId}/channels`, data),

  joinChannel: (wsId: string, channelId: string) =>
    apiClient.post<void>(`/workspaces/${wsId}/channels/${channelId}/join`),
}
