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
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set({ workspaces: [], currentWorkspace: null, isLoading: false }),
}))
