import { Test, TestingModule } from '@nestjs/testing'
import { HttpException, HttpStatus } from '@nestjs/common'
import { ChannelsService } from './channels.service'
import { ChannelsRepository } from './channels.repository'

const mockChannelsRepository = {
  findById: jest.fn(),
  findAccessibleChannels: jest.fn(),
  findMembersByChannelId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  isMember: jest.fn(),
  addMember: jest.fn(),
  removeMember: jest.fn(),
}

const baseChannel = {
  id: 'ch-1',
  name: 'general',
  workspaceId: 'ws-1',
  isDefault: false,
  isPrivate: false,
  description: null,
  createdAt: new Date(),
}

describe('ChannelsService', () => {
  let service: ChannelsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        { provide: ChannelsRepository, useValue: mockChannelsRepository },
      ],
    }).compile()

    service = module.get<ChannelsService>(ChannelsService)
    jest.clearAllMocks()
  })

  describe('deleteChannel', () => {
    it('通常チャンネルを削除できる', async () => {
      mockChannelsRepository.findById.mockResolvedValue(baseChannel)
      mockChannelsRepository.delete.mockResolvedValue(baseChannel)

      await service.deleteChannel('ch-1', 'ws-1')

      expect(mockChannelsRepository.delete).toHaveBeenCalledWith('ch-1')
    })

    it('デフォルトチャンネルの削除は403エラーをスローする', async () => {
      mockChannelsRepository.findById.mockResolvedValue({ ...baseChannel, isDefault: true })

      await expect(service.deleteChannel('ch-1', 'ws-1')).rejects.toThrow(
        new HttpException('デフォルトチャンネルは削除できません', HttpStatus.FORBIDDEN),
      )
    })

    it('存在しないチャンネルの削除は404エラーをスローする', async () => {
      mockChannelsRepository.findById.mockResolvedValue(null)

      await expect(service.deleteChannel('non-existent', 'ws-1')).rejects.toThrow(
        new HttpException('チャンネルが見つかりません', HttpStatus.NOT_FOUND),
      )
    })

    it('別ワークスペースのチャンネルIDを指定した場合は404エラーをスローする（IDOR対策）', async () => {
      mockChannelsRepository.findById.mockResolvedValue({ ...baseChannel, workspaceId: 'ws-other' })

      await expect(service.deleteChannel('ch-1', 'ws-1')).rejects.toThrow(
        new HttpException('チャンネルが見つかりません', HttpStatus.NOT_FOUND),
      )
    })
  })

  describe('joinChannel', () => {
    it('パブリックチャンネルに参加できる', async () => {
      mockChannelsRepository.findById.mockResolvedValue(baseChannel)
      mockChannelsRepository.isMember.mockResolvedValue(false)
      mockChannelsRepository.addMember.mockResolvedValue({ userId: 'user-1', channelId: 'ch-1' })

      await service.joinChannel('ch-1', 'ws-1', 'user-1')

      expect(mockChannelsRepository.addMember).toHaveBeenCalledWith('user-1', 'ch-1')
    })

    it('プライベートチャンネルへの直接参加は403エラーをスローする', async () => {
      mockChannelsRepository.findById.mockResolvedValue({ ...baseChannel, isPrivate: true })

      await expect(service.joinChannel('ch-1', 'ws-1', 'user-1')).rejects.toThrow(
        new HttpException('プライベートチャンネルには招待が必要です', HttpStatus.FORBIDDEN),
      )
    })

    it('既に参加済みのチャンネルへの参加は409エラーをスローする', async () => {
      mockChannelsRepository.findById.mockResolvedValue(baseChannel)
      mockChannelsRepository.isMember.mockResolvedValue(true)

      await expect(service.joinChannel('ch-1', 'ws-1', 'user-1')).rejects.toThrow(
        new HttpException('既にチャンネルに参加しています', HttpStatus.CONFLICT),
      )
    })
  })
})
