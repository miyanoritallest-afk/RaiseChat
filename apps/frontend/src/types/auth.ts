export type User = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  status: 'ONLINE' | 'AWAY' | 'OFFLINE'
  statusMessage?: string | null
  createdAt?: string
  updatedAt?: string
}

export type AuthResponse = {
  token: string
  user: User
}
