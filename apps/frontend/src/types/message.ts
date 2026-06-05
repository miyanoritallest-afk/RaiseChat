export type MessageReaction = {
  emoji: string
  count: number
  hasMe: boolean
}

export type MessageAttachment = {
  id: string
  fileUrl: string
  fileType: 'IMAGE' | 'VIDEO'
  fileName: string
  fileSize: number
}

export type Message = {
  id: string
  content: string
  channelId: string
  threadId: string | null
  editedAt: string | null
  createdAt: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    status: 'ONLINE' | 'AWAY' | 'OFFLINE'
  }
  attachments: MessageAttachment[]
  reactions: MessageReaction[]
  _count: {
    replies: number
  }
}

export type MessagesResponse = {
  messages: Message[]
  nextCursor: string | null
  hasMore: boolean
}
