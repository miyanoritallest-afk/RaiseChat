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
