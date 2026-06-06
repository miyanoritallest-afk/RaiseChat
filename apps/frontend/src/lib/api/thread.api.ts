import { apiClient } from './client'
import type { ThreadRepliesResponse } from '@/types/thread'

export const threadApi = {
  getReplies: (
    wsId: string,
    channelId: string,
    messageId: string,
    cursor?: string,
    limit?: number,
  ) => {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', cursor)
    if (limit) params.set('limit', String(limit))
    const query = params.toString()
    return apiClient.get<ThreadRepliesResponse>(
      `/workspaces/${wsId}/channels/${channelId}/messages/${messageId}/replies${query ? `?${query}` : ''}`,
    )
  },
}
