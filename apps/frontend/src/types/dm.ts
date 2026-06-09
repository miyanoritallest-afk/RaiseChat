export type DmRoomMember = {
  userId: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    status: 'ONLINE' | 'AWAY' | 'OFFLINE'
  }
}

export type DmRoom = {
  id: string
  name: string | null
  isGroup: boolean
  createdAt: string
  members: DmRoomMember[]
}

export type DmMessageAttachment = {
  id: string
  fileUrl: string
  fileType: 'IMAGE' | 'VIDEO'
  fileName: string
  fileSize: number
}

export type DmMessage = {
  id: string
  content: string
  dmRoomId: string
  editedAt: string | null
  createdAt: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    status: 'ONLINE' | 'AWAY' | 'OFFLINE'
  }
  attachments: DmMessageAttachment[]
}

export type DmMessagesResponse = {
  messages: DmMessage[]
  nextCursor: string | null
  hasMore: boolean
}

// DM部屋の表示名を取得するユーティリティ関数
export function getDmRoomDisplayName(room: DmRoom, myUserId: string): string {
  if (room.name) return room.name
  if (room.isGroup) {
    const others = room.members.filter((m) => m.userId !== myUserId)
    return others.map((m) => m.user.displayName).join(', ') || 'グループDM'
  }
  const other = room.members.find((m) => m.userId !== myUserId)
  return other?.user.displayName ?? 'Unknown'
}
