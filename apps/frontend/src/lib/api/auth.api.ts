import { apiClient } from './client'
import type { AuthResponse, User } from '@/types/auth'

type RegisterInput = {
  username: string
  displayName: string
  password: string
}

type LoginInput = {
  username: string
  password: string
}

export const authApi = {
  register: (data: RegisterInput) => apiClient.post<AuthResponse>('/auth/register', data),
  login: (data: LoginInput) =>
    apiClient.post<AuthResponse>('/auth/login', data, { skipAuthRedirect: true }),
  logout: () => apiClient.post<{ message: string }>('/auth/logout'),
  getMe: () => apiClient.get<User>('/auth/me'),
}
