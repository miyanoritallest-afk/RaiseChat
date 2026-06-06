import { apiClient } from './client'
import type { Pin } from '@/types/pin'

export const pinApi = {
  getPins: (wsId: string, channelId: string) =>
    apiClient.get<Pin[]>(`/workspaces/${wsId}/channels/${channelId}/pins`),

  addPin: (wsId: string, channelId: string, messageId: string) =>
    apiClient.post<Pin>(`/workspaces/${wsId}/channels/${channelId}/pins`, { messageId }),

  removePin: (wsId: string, channelId: string, messageId: string) =>
    apiClient.delete<void>(`/workspaces/${wsId}/channels/${channelId}/pins/${messageId}`),
}
