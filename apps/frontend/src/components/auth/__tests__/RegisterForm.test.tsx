import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from '../RegisterForm'

vi.mock('@/lib/api/auth.api', () => ({
  authApi: {
    register: vi.fn(),
  },
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(() => ({ setAuth: vi.fn() })),
}))

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('フォームが正しくレンダリングされる', () => {
    render(<RegisterForm />)

    expect(screen.getByText('アカウント登録')).toBeDefined()
    expect(screen.getByPlaceholderText('例: john_doe')).toBeDefined()
    expect(screen.getByPlaceholderText('例: John Doe')).toBeDefined()
    expect(screen.getByPlaceholderText('8文字以上')).toBeDefined()
    expect(screen.getByRole('button', { name: /登録する/ })).toBeDefined()
  })

  it('3文字未満のusernameでバリデーションエラーが表示される', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('例: john_doe'), 'ab')
    await user.click(screen.getByRole('button', { name: /登録する/ }))

    await waitFor(() => {
      expect(screen.getByText('3文字以上で入力してください')).toBeDefined()
    })
  })

  it('記号を含むusernameでバリデーションエラーが表示される（英数字・アンダースコアのみ）', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('例: john_doe'), 'user@name!')
    await user.click(screen.getByRole('button', { name: /登録する/ }))

    await waitFor(() => {
      expect(screen.getByText('英数字・アンダースコアのみ使用できます')).toBeDefined()
    })
  })

  it('8文字未満のパスワードでバリデーションエラーが表示される', async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('例: john_doe'), 'validuser')
    await user.type(screen.getByPlaceholderText('例: John Doe'), 'Valid User')
    await user.type(screen.getByPlaceholderText('8文字以上'), 'short')
    await user.click(screen.getByRole('button', { name: /登録する/ }))

    await waitFor(() => {
      expect(screen.getByText('8文字以上で入力してください')).toBeDefined()
    })
  })

  it('正常な入力でAPIが呼ばれる', async () => {
    const { authApi } = await import('@/lib/api/auth.api')
    vi.mocked(authApi.register).mockResolvedValue({
      token: 'test-token',
      user: {
        id: 'u1',
        username: 'newuser',
        displayName: 'New User',
        avatarUrl: null,
        status: 'ONLINE',
      },
    })

    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByPlaceholderText('例: john_doe'), 'newuser')
    await user.type(screen.getByPlaceholderText('例: John Doe'), 'New User')
    await user.type(screen.getByPlaceholderText('8文字以上'), 'password123')
    await user.click(screen.getByRole('button', { name: /登録する/ }))

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        username: 'newuser',
        displayName: 'New User',
        password: 'password123',
      })
    })
  })
})
