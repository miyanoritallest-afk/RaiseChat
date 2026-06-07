import { Test, TestingModule } from '@nestjs/testing'
import { HttpException, HttpStatus } from '@nestjs/common'
import { PinsService } from './pins.service'
import { PinsRepository } from './pins.repository'
import { MessagesRepository } from '../messages/messages.repository'
import { WorkspacesRepository } from '../workspaces/workspaces.repository'

const mockPinsRepository = {
  findManyByChannelId: jest.fn(),
  findByMessageAndChannel: jest.fn(),
  getChannelWorkspaceId: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
}

const mockMessagesRepository = {
  findById: jest.fn(),
}

const mockWorkspacesRepository = {
  isOwner: jest.fn(),
}

const baseMessage = { id: 'msg-1', channelId: 'ch-1', userId: 'author-1' }
const basePin = { id: 'pin-1', messageId: 'msg-1', channelId: 'ch-1', userId: 'pinner-1' }

describe('PinsService', () => {
  let service: PinsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PinsService,
        { provide: PinsRepository, useValue: mockPinsRepository },
        { provide: MessagesRepository, useValue: mockMessagesRepository },
        { provide: WorkspacesRepository, useValue: mockWorkspacesRepository },
      ],
    }).compile()

    service = module.get<PinsService>(PinsService)
    jest.clearAllMocks()
  })

  describe('addPin', () => {
    it('チャンネルに属するメッセージをピン留めできる', async () => {
      mockMessagesRepository.findById.mockResolvedValue(baseMessage)
      mockPinsRepository.findByMessageAndChannel.mockResolvedValue(null)
      mockPinsRepository.create.mockResolvedValue(basePin)

      await service.addPin('msg-1', 'ch-1', 'user-1')

      expect(mockPinsRepository.create).toHaveBeenCalledWith('msg-1', 'ch-1', 'user-1')
    })

    it('別チャンネルのメッセージIDを指定した場合は404エラーをスローする（IDOR対策）', async () => {
      mockMessagesRepository.findById.mockResolvedValue({ ...baseMessage, channelId: 'ch-other' })

      await expect(service.addPin('msg-1', 'ch-1', 'user-1')).rejects.toThrow(
        new HttpException('メッセージが見つかりません', HttpStatus.NOT_FOUND),
      )
    })

    it('存在しないメッセージのピン留めは404エラーをスローする', async () => {
      mockMessagesRepository.findById.mockResolvedValue(null)

      await expect(service.addPin('non-existent', 'ch-1', 'user-1')).rejects.toThrow(
        new HttpException('メッセージが見つかりません', HttpStatus.NOT_FOUND),
      )
    })

    it('既にピン留め済みのメッセージは409エラーをスローする', async () => {
      mockMessagesRepository.findById.mockResolvedValue(baseMessage)
      mockPinsRepository.findByMessageAndChannel.mockResolvedValue(basePin)

      await expect(service.addPin('msg-1', 'ch-1', 'user-1')).rejects.toThrow(
        new HttpException('このメッセージは既にピン留めされています', HttpStatus.CONFLICT),
      )
    })
  })

  describe('removePin', () => {
    it('ピン追加者はピン留めを削除できる', async () => {
      mockPinsRepository.findByMessageAndChannel.mockResolvedValue(basePin)
      mockPinsRepository.delete.mockResolvedValue(basePin)

      await service.removePin('msg-1', 'ch-1', 'pinner-1')

      expect(mockPinsRepository.delete).toHaveBeenCalledWith('pin-1')
    })

    it('ワークスペースオーナーは他のユーザーのピン留めを削除できる', async () => {
      mockPinsRepository.findByMessageAndChannel.mockResolvedValue(basePin)
      mockPinsRepository.getChannelWorkspaceId.mockResolvedValue('ws-1')
      mockWorkspacesRepository.isOwner.mockResolvedValue(true)
      mockPinsRepository.delete.mockResolvedValue(basePin)

      await service.removePin('msg-1', 'ch-1', 'owner-user')

      expect(mockPinsRepository.delete).toHaveBeenCalledWith('pin-1')
    })

    it('第三者がピン留めを削除しようとすると403エラーをスローする', async () => {
      mockPinsRepository.findByMessageAndChannel.mockResolvedValue(basePin)
      mockPinsRepository.getChannelWorkspaceId.mockResolvedValue('ws-1')
      mockWorkspacesRepository.isOwner.mockResolvedValue(false)

      await expect(service.removePin('msg-1', 'ch-1', 'third-party')).rejects.toThrow(
        new HttpException('このピン留めを削除する権限がありません', HttpStatus.FORBIDDEN),
      )
    })

    it('存在しないピン留めの削除は404エラーをスローする', async () => {
      mockPinsRepository.findByMessageAndChannel.mockResolvedValue(null)

      await expect(service.removePin('msg-1', 'ch-1', 'user-1')).rejects.toThrow(
        new HttpException('ピン留めが見つかりません', HttpStatus.NOT_FOUND),
      )
    })
  })
})
