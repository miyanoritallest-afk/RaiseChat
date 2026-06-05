'use client'

import { create } from 'zustand'
import type { User } from '@/types/auth'
import { authApi } from '@/lib/api/auth.api'

type AuthStore = {
  user: User | null
  token: string | null
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  initializeAuth: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    set({ user, token, isLoading: false })
  },

  clearAuth: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isLoading: false })
  },

  initializeAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isLoading: false })
      return
    }
    try {
      const user = await authApi.getMe()
      set({ user, token, isLoading: false })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, isLoading: false })
    }
  },
}))
