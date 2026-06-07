import { Test, TestingModule } from '@nestjs/testing'
import { WsException } from '@nestjs/websockets'
import { GatewayService } from './gateway.service'
import { PrismaService } from '../prisma/prisma.service'
import { MessagesRepository } from '../messages/messages.repository'
import { WorkspacesRepository } from '../workspaces/workspaces.repository'
import { DmRoomsRepository } from '../dm-rooms/dm-rooms.repository'
import { NotificationsService } from '../notifications/notifications.service'
import { ReactionsService } from '../reactions/reactions.service'
import { PinsService } from '../pins/pins.service'

const mockPrisma = {
  workspaceMember: { findUnique: jest.fn(), findMany: jest.fn() },
  channelMember: { findUnique: jest.fn(), findMany: jest.fn() },
  channel: { findUnique: jest.fn() },
  user: { update: jest.fn() },
  message: { findUnique: jest.fn() },
  dmRoomMember: { findMany: jest.fn() },
}

const mockMessagesRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}

const mockWorkspacesRepository = {
  isOwner: jest.fn(),
}

const mockDmRoomsRepository = {}
const mockNotificationsService = {
  notifyMentions: jest.fn().mockResolvedValue(undefined),
  notifyThreadReply: jest.fn().mockResolvedValue(undefined),
}
const mockReactionsService = {}
const mockPinsService = {}

describe('GatewayService', () => {
  let service: GatewayService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatewayService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MessagesRepository, useValue: mockMessagesRepository },
        { provide: WorkspacesRepository, useValue: mockWorkspacesRepository },
        { provide: DmRoomsRepository, useValue: mockDmRoomsRepository },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: ReactionsService, useValue: mockReactionsService },
        { provide: PinsService, useValue: mockPinsService },
      ],
    }).compile()

    service = module.get<GatewayService>(GatewayService)
    jest.clearAllMocks()
  })

  describe('isChannelMember', () => {
    it('チャンネルメンバーのときtrueを返す', async () => {
      mockPrisma.channelMember.findUnique.mockResolvedValue({ id: 'member-1' })

      const result = await service.isChannelMember('user-1', 'ch-1')

      expect(result).toBe(true)
    })

    it('チャンネル非メンバーのときfalseを返す', async () => {
      mockPrisma.channelMember.findUnique.mockResolvedValue(null)

      const result = await service.isChannelMember('user-1', 'ch-1')

      expect(result).toBe(false)
    })
  })

  describe('isWorkspaceMember', () => {
    it('ワークスペースメンバーのときtrueを返す', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ id: 'member-1' })

      const result = await service.isWorkspaceMember('user-1', 'ws-1')

      expect(result).toBe(true)
    })

    it('ワークスペース非メンバーのときfalseを返す', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null)

      const result = await service.isWorkspaceMember('user-1', 'ws-1')

      expect(result).toBe(false)
    })
  })

  describe('createMessage（s3Keyバリデーション）', () => {
    const baseData = {
      channelId: 'ch-1',
      userId: 'user-1',
      content: 'Hello',
    }

    it('添付なしのメッセージは正常に作成される', async () => {
      const createdMessage = { id: 'msg-1', ...baseData, reactions: [], attachments: [] }
      mockMessagesRepository.create.mockResolvedValue(createdMessage)

      const result = await service.createMessage(baseData)

      expect(result.id).toBe('msg-1')
    })

    it('workspaceId/で始まる正しいs3Keyの添付ファイルは許可される', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue({ workspaceId: 'ws-1' })
      const createdMessage = { id: 'msg-1', ...baseData, reactions: [], attachments: [] }
      mockMessagesRepository.create.mockResolvedValue(createdMessage)

      const result = await service.createMessage({
        ...baseData,
        attachments: [
          {
            s3Key: 'ws-1/file.png',
            fileType: 'IMAGE' as const,
            fileName: 'file.png',
            fileSize: 1024,
          },
        ],
      })

      expect(result.id).toBe('msg-1')
    })

    it('別ワークスペースのs3Keyを指定した場合はWsExceptionをスローする（クロスワークスペースIDOR対策）', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue({ workspaceId: 'ws-1' })

      await expect(
        service.createMessage({
          ...baseData,
          attachments: [
            {
              s3Key: 'ws-other/file.png',
              fileType: 'IMAGE' as const,
              fileName: 'file.png',
              fileSize: 1024,
            },
          ],
        }),
      ).rejects.toThrow(WsException)
    })

    it('存在しないチャンネルへのメッセージ送信はWsExceptionをスローする', async () => {
      mockPrisma.channel.findUnique.mockResolvedValue(null)

      await expect(
        service.createMessage({
          ...baseData,
          attachments: [
            {
              s3Key: 'ws-1/file.png',
              fileType: 'IMAGE' as const,
              fileName: 'file.png',
              fileSize: 1024,
            },
          ],
        }),
      ).rejects.toThrow(WsException)
    })
  })
})
