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

export type MessageUser = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  status: 'ONLINE' | 'AWAY' | 'OFFLINE'
}

export type Message = {
  id: string
  content: string
  channelId: string
  threadId: string | null
  editedAt: string | null
  createdAt: string
  user: MessageUser
  attachments: MessageAttachment[]
  reactions: MessageReaction[]
  _count: {
    replies: number
  }
  // スレッドパネルのアバター表示用（最新3件の返信者）
  replies: Array<{
    user: Pick<MessageUser, 'id' | 'displayName' | 'avatarUrl'>
  }>
}

export type MessagesResponse = {
  messages: Message[]
  nextCursor: string | null
  hasMore: boolean
}
