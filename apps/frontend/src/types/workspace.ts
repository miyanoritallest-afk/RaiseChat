export type Workspace = {
  id: string
  name: string
  description: string | null
  iconUrl: string | null
  inviteCode: string
  createdAt: string
  _count: {
    members: number
  }
}

export type WorkspaceMember = {
  id: string
  role: 'OWNER' | 'MEMBER'
  createdAt: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    status: 'ONLINE' | 'AWAY' | 'OFFLINE'
  }
}
