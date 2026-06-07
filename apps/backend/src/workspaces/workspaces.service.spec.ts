import { Test, TestingModule } from '@nestjs/testing'
import { HttpException, HttpStatus } from '@nestjs/common'
import { WorkspacesService } from './workspaces.service'
import { WorkspacesRepository } from './workspaces.repository'

const mockWorkspacesRepository = {
  findManyByUserId: jest.fn(),
  findById: jest.fn(),
  findMembersByWorkspaceId: jest.fn(),
  createWithGeneralChannel: jest.fn(),
  joinByInviteCode: jest.fn(),
  removeMember: jest.fn(),
  isOwner: jest.fn(),
}

const baseWorkspace = {
  id: 'ws-1',
  name: 'Test Workspace',
  description: 'A test workspace',
  iconUrl: null,
  inviteCode: 'invite-abc123',
  createdAt: new Date(),
}

describe('WorkspacesService', () => {
  let service: WorkspacesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: WorkspacesRepository, useValue: mockWorkspacesRepository },
      ],
    }).compile()

    service = module.get<WorkspacesService>(WorkspacesService)
    jest.clearAllMocks()
  })

  describe('createWorkspace', () => {
    it('ワークスペースを作成してgeneralチャンネルと共に返す', async () => {
      mockWorkspacesRepository.createWithGeneralChannel.mockResolvedValue(baseWorkspace)

      const result = await service.createWorkspace('user-1', {
        name: 'Test Workspace',
        description: 'A test workspace',
      })

      expect(result.name).toBe('Test Workspace')
      expect(mockWorkspacesRepository.createWithGeneralChannel).toHaveBeenCalledWith({
        name: 'Test Workspace',
        description: 'A test workspace',
        ownerId: 'user-1',
      })
    })
  })

  describe('getWorkspace', () => {
    it('ワークスペースを取得できる', async () => {
      mockWorkspacesRepository.findById.mockResolvedValue(baseWorkspace)

      const result = await service.getWorkspace('ws-1')

      expect(result.id).toBe('ws-1')
    })

    it('存在しないワークスペースは404エラーをスローする', async () => {
      mockWorkspacesRepository.findById.mockResolvedValue(null)

      await expect(service.getWorkspace('non-existent')).rejects.toThrow(
        new HttpException('ワークスペースが見つかりません', HttpStatus.NOT_FOUND),
      )
    })
  })

  describe('joinWorkspace', () => {
    it('有効な招待コードでワークスペースに参加できる', async () => {
      mockWorkspacesRepository.joinByInviteCode.mockResolvedValue(baseWorkspace)

      const result = await service.joinWorkspace('user-2', { inviteCode: 'invite-abc123' })

      expect(result.id).toBe('ws-1')
      expect(mockWorkspacesRepository.joinByInviteCode).toHaveBeenCalledWith(
        'invite-abc123',
        'user-2',
      )
    })

    it('無効な招待コードの場合は404エラーをスローする', async () => {
      mockWorkspacesRepository.joinByInviteCode.mockResolvedValue(null)

      await expect(service.joinWorkspace('user-2', { inviteCode: 'invalid-code' })).rejects.toThrow(
        new HttpException('招待コードが無効です', HttpStatus.NOT_FOUND),
      )
    })
  })
})
