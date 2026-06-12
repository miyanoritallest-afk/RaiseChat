import { apiClient } from './client'
import type { Workspace, WorkspaceMember } from '@/types/workspace'

export const workspaceApi = {
  getMyWorkspaces: () => apiClient.get<Workspace[]>('/workspaces'),

  getWorkspace: (wsId: string) => apiClient.get<Workspace>(`/workspaces/${wsId}`),

  createWorkspace: (data: { name: string; description?: string }) =>
    apiClient.post<Workspace>('/workspaces', data),

  joinWorkspace: (inviteCode: string) =>
    apiClient.post<Workspace>('/workspaces/join', { inviteCode }),

  getMembers: (wsId: string) => apiClient.get<WorkspaceMember[]>(`/workspaces/${wsId}/members`),

  updateWorkspace: (wsId: string, data: { name?: string; description?: string }) =>
    apiClient.patch<Workspace>(`/workspaces/${wsId}`, data),

  deleteWorkspace: (wsId: string) => apiClient.delete<void>(`/workspaces/${wsId}`),
}
