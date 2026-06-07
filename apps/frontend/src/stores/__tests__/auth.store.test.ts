import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../auth.store'

// authApiをモック
vi.mock('@/lib/api/auth.api', () => ({
  authApi: {
    getMe: vi.fn(),
  },
}))

const baseUser = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: null,
  status: 'ONLINE' as const,
}

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ user: null, token: null, isLoading: true })
  })

  describe('setAuth', () => {
    it('tokenをlocalStorageに保存してstoreを更新する', () => {
      useAuthStore.getState().setAuth(baseUser, 'my-token')

      expect(localStorage.getItem('token')).toBe('my-token')
      const { user, token, isLoading } = useAuthStore.getState()
      expect(user?.username).toBe('testuser')
      expect(token).toBe('my-token')
      expect(isLoading).toBe(false)
    })
  })

  describe('clearAuth', () => {
    it('tokenをlocalStorageから削除してstoreをリセットする', () => {
      useAuthStore.getState().setAuth(baseUser, 'my-token')
      useAuthStore.getState().clearAuth()

      expect(localStorage.getItem('token')).toBeNull()
      const { user, token } = useAuthStore.getState()
      expect(user).toBeNull()
      expect(token).toBeNull()
    })
  })

  describe('initializeAuth', () => {
    it('localStorageにtokenがない場合はisLoadingをfalseにしてnullのままにする', async () => {
      localStorage.clear()

      await useAuthStore.getState().initializeAuth()

      const { user, token, isLoading } = useAuthStore.getState()
      expect(user).toBeNull()
      expect(token).toBeNull()
      expect(isLoading).toBe(false)
    })

    it('localStorageにtokenがある場合はAPIを呼び出してユーザーをセットする', async () => {
      const { authApi } = await import('@/lib/api/auth.api')
      vi.mocked(authApi.getMe).mockResolvedValue(baseUser)
      localStorage.setItem('token', 'saved-token')

      await useAuthStore.getState().initializeAuth()

      const { user, token } = useAuthStore.getState()
      expect(user?.username).toBe('testuser')
      expect(token).toBe('saved-token')
    })

    it('API呼び出し失敗時はtokenを削除してnullにする', async () => {
      const { authApi } = await import('@/lib/api/auth.api')
      vi.mocked(authApi.getMe).mockRejectedValue(new Error('Unauthorized'))
      localStorage.setItem('token', 'expired-token')

      await useAuthStore.getState().initializeAuth()

      expect(localStorage.getItem('token')).toBeNull()
      const { user, token } = useAuthStore.getState()
      expect(user).toBeNull()
      expect(token).toBeNull()
    })
  })
})
