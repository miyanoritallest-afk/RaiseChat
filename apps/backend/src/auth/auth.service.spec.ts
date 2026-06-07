import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { AuthService } from './auth.service'
import { AuthRepository } from './auth.repository'

const mockAuthRepository = {
  findByUsername: jest.fn(),
  findById: jest.fn(),
  createUser: jest.fn(),
}

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
}

const baseUser = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: null,
  status: 'ONLINE' as const,
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('新規ユーザーを作成してトークンを返す', async () => {
      mockAuthRepository.findByUsername.mockResolvedValue(null)
      mockAuthRepository.createUser.mockResolvedValue(baseUser)

      const result = await service.register({
        username: 'testuser',
        displayName: 'Test User',
        password: 'password123',
      })

      expect(result.token).toBe('mock-token')
      expect(result.user.username).toBe('testuser')
      expect(mockAuthRepository.createUser).toHaveBeenCalledTimes(1)
    })

    it('username重複のときConflictExceptionをスローする', async () => {
      mockAuthRepository.findByUsername.mockResolvedValue({ ...baseUser, passwordHash: 'hash' })

      await expect(
        service.register({
          username: 'testuser',
          displayName: 'Test User',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException)
    })

    it('パスワードは平文のままDBに保存されない（bcryptでハッシュ化される）', async () => {
      mockAuthRepository.findByUsername.mockResolvedValue(null)
      mockAuthRepository.createUser.mockResolvedValue(baseUser)

      const plainPassword = 'password123'
      await service.register({
        username: 'testuser',
        displayName: 'Test User',
        password: plainPassword,
      })

      const savedHash = mockAuthRepository.createUser.mock.calls[0][0].passwordHash as string
      expect(savedHash).not.toBe(plainPassword)
      const isValid = await bcrypt.compare(plainPassword, savedHash)
      expect(isValid).toBe(true)
    })
  })

  describe('login', () => {
    const passwordHash = bcrypt.hashSync('correct-password', 10)
    const userWithHash = { ...baseUser, passwordHash }

    it('正しい認証情報でトークンを返す', async () => {
      mockAuthRepository.findByUsername.mockResolvedValue(userWithHash)

      const result = await service.login({
        username: 'testuser',
        password: 'correct-password',
      })

      expect(result.token).toBe('mock-token')
      expect(result.user.id).toBe('user-1')
    })

    it('存在しないusernameのときUnauthorizedExceptionをスローする', async () => {
      mockAuthRepository.findByUsername.mockResolvedValue(null)

      await expect(
        service.login({ username: 'unknown', password: 'any-password' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('パスワード不一致のときUnauthorizedExceptionをスローする', async () => {
      mockAuthRepository.findByUsername.mockResolvedValue(userWithHash)

      await expect(
        service.login({ username: 'testuser', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    // ユーザー列挙攻撃対策: 存在しないユーザーとパスワード不一致で同じエラーメッセージ
    it('ユーザー不存在とパスワード不一致で同一のエラーメッセージを返す（ユーザー列挙攻撃対策）', async () => {
      mockAuthRepository.findByUsername.mockResolvedValue(null)
      let errorForUnknownUser: UnauthorizedException | null = null
      try {
        await service.login({ username: 'unknown', password: 'any' })
      } catch (e) {
        errorForUnknownUser = e as UnauthorizedException
      }

      mockAuthRepository.findByUsername.mockResolvedValue(userWithHash)
      let errorForWrongPassword: UnauthorizedException | null = null
      try {
        await service.login({ username: 'testuser', password: 'wrong' })
      } catch (e) {
        errorForWrongPassword = e as UnauthorizedException
      }

      expect(errorForUnknownUser?.message).toBe(errorForWrongPassword?.message)
    })
  })

  describe('getMe', () => {
    it('ユーザーIDに対応するユーザーを返す', async () => {
      mockAuthRepository.findById.mockResolvedValue(baseUser)

      const result = await service.getMe('user-1')

      expect(result.id).toBe('user-1')
      expect(result.username).toBe('testuser')
    })

    it('ユーザーが存在しないときNotFoundExceptionをスローする', async () => {
      mockAuthRepository.findById.mockResolvedValue(null)

      await expect(service.getMe('non-existent')).rejects.toThrow(NotFoundException)
    })
  })
})
