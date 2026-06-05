export type Channel = {
  id: string
  workspaceId?: string
  name: string
  description: string | null
  isPrivate: boolean
  isDefault: boolean
  createdAt: string
  _count: {
    members: number
  }
}

export type ChannelMember = {
  id: string
  createdAt: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    status: 'ONLINE' | 'AWAY' | 'OFFLINE'
  }
}
