import { apiClient } from './client'

export type RawReactionPayload = {
  messageId: string
  reactions: { emoji: string; userIds: string[] }[]
}

export const reactionApi = {
  addReaction: (wsId: string, channelId: string, messageId: string, emoji: string) =>
    apiClient.post<RawReactionPayload>(
      `/workspaces/${wsId}/channels/${channelId}/messages/${messageId}/reactions`,
      { emoji },
    ),

  removeReaction: (wsId: string, channelId: string, messageId: string, emoji: string) =>
    apiClient.delete<void>(
      `/workspaces/${wsId}/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    ),
}
