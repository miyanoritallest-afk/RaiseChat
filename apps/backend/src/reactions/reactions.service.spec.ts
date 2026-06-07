import { Test, TestingModule } from '@nestjs/testing'
import { HttpException, HttpStatus } from '@nestjs/common'
import { ReactionsService } from './reactions.service'
import { ReactionsRepository } from './reactions.repository'
import { MessagesRepository } from '../messages/messages.repository'

const mockReactionsRepository = {
  findOne: jest.fn(),
  findByMessageId: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
}

const mockMessagesRepository = {
  findById: jest.fn(),
}

const baseMessage = {
  id: 'msg-1',
  channelId: 'ch-1',
  userId: 'author-1',
}

describe('ReactionsService', () => {
  let service: ReactionsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionsService,
        { provide: ReactionsRepository, useValue: mockReactionsRepository },
        { provide: MessagesRepository, useValue: mockMessagesRepository },
      ],
    }).compile()

    service = module.get<ReactionsService>(ReactionsService)
    jest.clearAllMocks()
  })

  describe('toggleReaction', () => {
    it('未リアクション状態でtoggleするとリアクションを追加してactionがaddedになる', async () => {
      mockMessagesRepository.findById.mockResolvedValue(baseMessage)
      mockReactionsRepository.findOne.mockResolvedValue(null)
      mockReactionsRepository.create.mockResolvedValue(undefined)
      mockReactionsRepository.findByMessageId.mockResolvedValue([{ emoji: '👍', userId: 'user-1' }])

      const result = await service.toggleReaction('msg-1', 'ch-1', 'user-1', '👍')

      expect(result.action).toBe('added')
      expect(mockReactionsRepository.create).toHaveBeenCalledWith('msg-1', 'user-1', '👍')
      expect(result.reactions).toEqual([{ emoji: '👍', userIds: ['user-1'] }])
    })

    it('リアクション済み状態でtoggleするとリアクションを削除してactionがremovedになる', async () => {
      mockMessagesRepository.findById.mockResolvedValue(baseMessage)
      mockReactionsRepository.findOne.mockResolvedValue({ id: 'reaction-1' })
      mockReactionsRepository.delete.mockResolvedValue(undefined)
      mockReactionsRepository.findByMessageId.mockResolvedValue([])

      const result = await service.toggleReaction('msg-1', 'ch-1', 'user-1', '👍')

      expect(result.action).toBe('removed')
      expect(mockReactionsRepository.delete).toHaveBeenCalledWith('msg-1', 'user-1', '👍')
      expect(result.reactions).toEqual([])
    })

    it('存在しないメッセージへのリアクションは404エラーをスローする', async () => {
      mockMessagesRepository.findById.mockResolvedValue(null)

      await expect(service.toggleReaction('non-existent', 'ch-1', 'user-1', '👍')).rejects.toThrow(
        new HttpException('メッセージが見つかりません', HttpStatus.NOT_FOUND),
      )
    })

    it('別チャンネルのメッセージIDを指定した場合は404エラーをスローする（IDOR対策）', async () => {
      mockMessagesRepository.findById.mockResolvedValue({ ...baseMessage, channelId: 'ch-other' })

      await expect(service.toggleReaction('msg-1', 'ch-1', 'user-1', '👍')).rejects.toThrow(
        new HttpException('メッセージが見つかりません', HttpStatus.NOT_FOUND),
      )
    })

    // 競合状態（ダブルクリック等）の冪等性テスト
    it('P2002エラー（重複作成競合）のときactionがaddedとして冪等に処理される', async () => {
      mockMessagesRepository.findById.mockResolvedValue(baseMessage)
      mockReactionsRepository.findOne.mockResolvedValue(null)
      const p2002Error = Object.assign(new Error('Unique constraint'), { code: 'P2002' })
      mockReactionsRepository.create.mockRejectedValue(p2002Error)
      mockReactionsRepository.findByMessageId.mockResolvedValue([{ emoji: '👍', userId: 'user-1' }])

      const result = await service.toggleReaction('msg-1', 'ch-1', 'user-1', '👍')

      expect(result.action).toBe('added')
    })

    it('P2025エラー（重複削除競合）のときactionがremovedとして冪等に処理される', async () => {
      mockMessagesRepository.findById.mockResolvedValue(baseMessage)
      mockReactionsRepository.findOne.mockResolvedValue({ id: 'reaction-1' })
      const p2025Error = Object.assign(new Error('Record not found'), { code: 'P2025' })
      mockReactionsRepository.delete.mockRejectedValue(p2025Error)
      mockReactionsRepository.findByMessageId.mockResolvedValue([])

      const result = await service.toggleReaction('msg-1', 'ch-1', 'user-1', '👍')

      expect(result.action).toBe('removed')
    })

    it('P2002/P2025以外のエラーは再スローされる', async () => {
      mockMessagesRepository.findById.mockResolvedValue(baseMessage)
      mockReactionsRepository.findOne.mockResolvedValue(null)
      const unexpectedError = Object.assign(new Error('Unexpected DB error'), { code: 'P9999' })
      mockReactionsRepository.create.mockRejectedValue(unexpectedError)

      await expect(service.toggleReaction('msg-1', 'ch-1', 'user-1', '👍')).rejects.toThrow(
        'Unexpected DB error',
      )
    })

    it('複数ユーザーのリアクションがemojiごとに正しく集約される', async () => {
      mockMessagesRepository.findById.mockResolvedValue(baseMessage)
      mockReactionsRepository.findOne.mockResolvedValue(null)
      mockReactionsRepository.create.mockResolvedValue(undefined)
      mockReactionsRepository.findByMessageId.mockResolvedValue([
        { emoji: '👍', userId: 'user-1' },
        { emoji: '👍', userId: 'user-2' },
        { emoji: '❤️', userId: 'user-1' },
      ])

      const result = await service.toggleReaction('msg-1', 'ch-1', 'user-1', '👍')

      const thumbsUp = result.reactions.find((r) => r.emoji === '👍')
      const heart = result.reactions.find((r) => r.emoji === '❤️')

      expect(thumbsUp?.userIds).toHaveLength(2)
      expect(heart?.userIds).toHaveLength(1)
    })
  })
})
