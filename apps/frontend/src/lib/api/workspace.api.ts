import { apiClient } from './client'
import type { Workspace } from '@/types/workspace'

export const workspaceApi = {
  getMyWorkspaces: () => apiClient.get<Workspace[]>('/workspaces'),

  getWorkspace: (wsId: string) => apiClient.get<Workspace>(`/workspaces/${wsId}`),

  createWorkspace: (data: { name: string; description?: string }) =>
    apiClient.post<Workspace>('/workspaces', data),

  joinWorkspace: (inviteCode: string) =>
    apiClient.post<Workspace>('/workspaces/join', { inviteCode }),
}
