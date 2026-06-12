'use client'

import { create } from 'zustand'
import type { Workspace } from '@/types/workspace'

type WorkspaceStore = {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  isLoading: boolean
  setWorkspaces: (workspaces: Workspace[]) => void
  setCurrentWorkspace: (workspace: Workspace | null) => void
  addWorkspace: (workspace: Workspace) => void
  updateWorkspace: (workspace: Workspace) => void
  removeWorkspace: (workspaceId: string) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,

  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  addWorkspace: (workspace) => set((state) => ({ workspaces: [...state.workspaces, workspace] })),
  updateWorkspace: (workspace) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) => (w.id === workspace.id ? workspace : w)),
      currentWorkspace:
        state.currentWorkspace?.id === workspace.id ? workspace : state.currentWorkspace,
    })),
  removeWorkspace: (workspaceId) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
      currentWorkspace: state.currentWorkspace?.id === workspaceId ? null : state.currentWorkspace,
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set({ workspaces: [], currentWorkspace: null, isLoading: false }),
}))
