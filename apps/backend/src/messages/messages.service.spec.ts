import { Test, TestingModule } from '@nestjs/testing'
import { HttpException, HttpStatus } from '@nestjs/common'
import { MessagesService } from './messages.service'
import { MessagesRepository } from './messages.repository'
import { WorkspacesRepository } from '../workspaces/workspaces.repository'
import { ChannelsRepository } from '../channels/channels.repository'

const mockMessagesRepository = {
  findManyByChannelId: jest.fn(),
  findById: jest.fn(),
  findRepliesByMessageId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
}

const mockWorkspacesRepository = {
  isOwner: jest.fn(),
}

const mockChannelsRepository = {
  findById: jest.fn(),
}

const baseChannel = { id: 'ch-1', workspaceId: 'ws-1', isDefault: false, isPrivate: false }

const baseMessage = {
  id: 'msg-1',
  channelId: 'ch-1',
  userId: 'author-1',
  content: 'Hello',
  reactions: [],
  attachments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  isDeleted: false,
}

describe('MessagesService', () => {
  let service: MessagesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: MessagesRepository, useValue: mockMessagesRepository },
        { provide: WorkspacesRepository, useValue: mockWorkspacesRepository },
        { provide: ChannelsRepository, useValue: mockChannelsRepository },
      ],
    }).compile()

    service = module.get<MessagesService>(MessagesService)
    jest.clearAllMocks()
  })

  describe('updateMessage', () => {
    const dto = { content: 'Updated content' }

    it('著者は自分のメッセージを更新できる', async () => {
      mockMessagesRepository.findById.mockResolvedValue(baseMessage)
      mockChannelsRepository.findById.mockResolvedValue(baseChannel)
      mockWorkspacesRepository.isOwner.mockResolvedValue(false)
      mockMessagesRepository.update.mockResolvedValue({
        ...baseMessage,
        content: 'Updated content',
        reactions: [],
      })

      const result = await service.updateMessage('msg-1', 'ch-1', 'author-1', dto)

      expect(result.content).toBe('Updated content')
      expect(mockMessagesRepository.update).toHaveBeenCalledWith('msg-1', 'Updated content')
    })

    it('ワークスペースオーナーは他のユーザーのメッセージを更新できる', async () => {
      mockMessagesRepository.findById.mockResolvedValue(baseMessage)
      mockChannelsRepository.findById.mockResolvedValue(baseChannel)
      mockWorkspacesRepository.isOwner.mockResolvedValue(true)
      mockMessagesRepository.update.mockResolvedValue({
        ...baseMessage,
        content: 'Updated content',
        reactions: [],
      })

      const result = await service.updateMessage('msg-1', 'ch-1', 'owner-user', dto)

      expect(result.content).toBe('Updated content')
    })

    it('第三者がメッセージを更新しようとすると403エラーをスローする', async () => {
      mockMessagesRepository.findById.mockResolvedValue(baseMessage)
      mockChannelsRepository.findById.mockResolvedValue(baseChannel)
      mockWorkspacesRepository.isOwner.mockResolvedValue(false)

      await expect(service.updateMessage('msg-1', 'ch-1', 'third-party', dto)).rejects.toThrow(
        new HttpException('このメッセージを編集する権限がありません', HttpStatus.FORBIDDEN),
      )
    })

    it('存在しないメッセージの更新は404エラーをスローする', async () => {
      mockMessagesRepository.findById.mockResolvedValue(null)

      await expect(service.updateMessage('non-existent', 'ch-1', 'author-1', dto)).rejects.toThrow(
        new HttpException('メッセージが見つかりません', HttpStatus.NOT_FOUND),
      )
    })

    it('別チャンネルのメッセージIDを指定した場合は404エラーをスローする（IDOR対策）', async () => {
      mockMessagesRepository.findById.mockResolvedValue({ ...baseMessage, channelId: 'ch-other' })

      await expect(service.updateMessage('msg-1', 'ch-1', 'author-1', dto)).rejects.toThrow(
        new HttpException('メッセージが見つかりません', HttpStatus.NOT_FOUND),
      )
    })
  })

  describe('deleteMessage', () => {
    it('著者は自分のメッセージを削除できる', async () => {
      mockMessagesRepository.findById.mockResolvedValue(baseMessage)
      mockChannelsRepository.findById.mockResolvedValue(baseChannel)
      mockWorkspacesRepository.isOwner.mockResolvedValue(false)
      mockMessagesRepository.softDelete.mockResolvedValue({ ...baseMessage, isDeleted: true })

      await service.deleteMessage('msg-1', 'ch-1', 'author-1')

      expect(mockMessagesRepository.softDelete).toHaveBeenCalledWith('msg-1')
    })

    it('第三者がメッセージを削除しようとすると403エラーをスローする', async () => {
      mockMessagesRepository.findById.mockResolvedValue(baseMessage)
      mockChannelsRepository.findById.mockResolvedValue(baseChannel)
      mockWorkspacesRepository.isOwner.mockResolvedValue(false)

      await expect(service.deleteMessage('msg-1', 'ch-1', 'third-party')).rejects.toThrow(
        new HttpException('このメッセージを削除する権限がありません', HttpStatus.FORBIDDEN),
      )
    })
  })

  describe('aggregateReactions（getMessagesを通じて間接的にテスト）', () => {
    it('同じemojiのリアクションをカウントして集約する', async () => {
      const reactions = [
        { emoji: '👍', userId: 'user-1' },
        { emoji: '👍', userId: 'user-2' },
        { emoji: '❤️', userId: 'user-1' },
      ]
      const message = { ...baseMessage, reactions }
      mockMessagesRepository.findManyByChannelId.mockResolvedValue([message])

      const result = await service.getMessages('ch-1', 'user-1', {})

      const thumbsUp = result.messages[0].reactions.find((r) => r.emoji === '👍')
      const heart = result.messages[0].reactions.find((r) => r.emoji === '❤️')

      expect(thumbsUp?.count).toBe(2)
      expect(thumbsUp?.hasMe).toBe(true)
      expect(heart?.count).toBe(1)
      expect(heart?.hasMe).toBe(true)
    })

    it('自分以外のリアクションはhasMeがfalseになる', async () => {
      const reactions = [{ emoji: '👍', userId: 'user-other' }]
      const message = { ...baseMessage, reactions }
      mockMessagesRepository.findManyByChannelId.mockResolvedValue([message])

      const result = await service.getMessages('ch-1', 'user-1', {})

      const thumbsUp = result.messages[0].reactions.find((r) => r.emoji === '👍')
      expect(thumbsUp?.hasMe).toBe(false)
    })
  })
})
