import type { MessageAttachment, MessageReaction, MessageUser } from './message'

export type ThreadReply = {
  id: string
  content: string
  channelId: string
  threadId: string
  editedAt: string | null
  createdAt: string
  user: MessageUser
  attachments: MessageAttachment[]
  reactions: MessageReaction[]
  _count: { replies: number }
  replies: Array<{ user: Pick<MessageUser, 'id' | 'displayName' | 'avatarUrl'> }>
}

export type ThreadRepliesResponse = {
  replies: ThreadReply[]
  nextCursor: string | null
  hasMore: boolean
}
