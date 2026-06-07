import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../LoginForm'

vi.mock('@/lib/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
  },
}))

const mockSetAuth = vi.fn()
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(() => ({ setAuth: mockSetAuth })),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('フォームが正しくレンダリングされる', () => {
    render(<LoginForm />)

    expect(screen.getByText('RaiseChat へログイン')).toBeDefined()
    expect(screen.getByText('ユーザー名')).toBeDefined()
    expect(screen.getByText('パスワード')).toBeDefined()
    expect(screen.getByRole('button', { name: /ログイン/ })).toBeDefined()
  })

  it('フォームフィールドが空のままsubmitするとバリデーションメッセージが表示される', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByRole('button', { name: /ログイン/ }))

    await waitFor(() => {
      expect(screen.getByText('ユーザー名を入力してください')).toBeDefined()
    })
  })

  it('API呼び出し成功時にsetAuthが呼ばれる', async () => {
    const { authApi } = await import('@/lib/api/auth.api')
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'test-token',
      user: {
        id: 'u1',
        username: 'testuser',
        displayName: 'Test',
        avatarUrl: null,
        status: 'ONLINE',
      },
    })

    const user = userEvent.setup()
    render(<LoginForm />)

    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'testuser')
    // パスワードはtype=passwordなのでgetAllByRole('textbox')には含まれない
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
    await user.type(passwordInput, 'password123')
    await user.click(screen.getByRole('button', { name: /ログイン/ }))

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({ username: 'testuser', password: 'password123' })
    })
  })

  it('API呼び出し失敗時にエラーメッセージが表示される', async () => {
    const { authApi } = await import('@/lib/api/auth.api')
    vi.mocked(authApi.login).mockRejectedValue(new Error('ログインに失敗しました'))

    const user = userEvent.setup()
    render(<LoginForm />)

    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], 'testuser')
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement
    await user.type(passwordInput, 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /ログイン/ }))

    await waitFor(() => {
      expect(screen.getByText('ログインに失敗しました')).toBeDefined()
    })
  })
})
