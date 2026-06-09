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

  updateChannel: (wsId: string, channelId: string, data: { name: string }) =>
    apiClient.patch<Channel>(`/workspaces/${wsId}/channels/${channelId}`, data),

  deleteChannel: (wsId: string, channelId: string) =>
    apiClient.delete<void>(`/workspaces/${wsId}/channels/${channelId}`),

  reorderChannels: (wsId: string, channelIds: string[]) =>
    apiClient.put<void>(`/workspaces/${wsId}/channels/reorder`, { channelIds }),
}
