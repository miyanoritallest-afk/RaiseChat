import { apiClient } from './client'
import type { SearchResponse } from '@/types/search'

export const searchApi = {
  searchMessages: (wsId: string, q: string, cursor?: string, limit = 20) => {
    const params = new URLSearchParams({ q, limit: String(limit) })
    if (cursor) params.set('cursor', cursor)
    return apiClient.get<SearchResponse>(`/workspaces/${wsId}/search?${params.toString()}`)
  },
}
