export type SearchResultMessage = {
  id: string
  content: string
  createdAt: string
  channel: { id: string; name: string }
  user: { id: string; displayName: string; avatarUrl: string | null }
}

export type SearchResponse = {
  messages: SearchResultMessage[]
  nextCursor: string | null
  hasMore: boolean
}
