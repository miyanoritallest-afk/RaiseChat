export type NotificationType =
  | 'MENTION'
  | 'UNREAD'
  | 'CHANNEL_INVITED'
  | 'WORKSPACE_INVITED'
  | 'THREAD_REPLY'
  | 'REACTION_ADDED'

export type Notification = {
  id: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  messageId: string | null
  channelId: string | null
  workspaceId: string | null
  channel: { id: string; name: string } | null
  workspace: { id: string; name: string } | null
  message: {
    id: string
    content: string
    user: { id: string; displayName: string; avatarUrl: string | null }
  } | null
}

export type NotificationsResponse = {
  notifications: Notification[]
  nextCursor: string | null
  hasMore: boolean
  unreadCount: number
}

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  MENTION: 'メンションされました',
  UNREAD: '新しいDMが届きました',
  CHANNEL_INVITED: 'チャンネルに招待されました',
  WORKSPACE_INVITED: 'ワークスペースに招待されました',
  THREAD_REPLY: 'スレッドに返信がありました',
  REACTION_ADDED: 'リアクションが追加されました',
}
