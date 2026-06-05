import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { MessagesRepository } from '../messages/messages.repository'
import { WorkspacesRepository } from '../workspaces/workspaces.repository'

@Injectable()
export class GatewayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesRepository: MessagesRepository,
    private readonly workspacesRepository: WorkspacesRepository,
  ) {}

  async isWorkspaceMember(userId: string, workspaceId: string): Promise<boolean> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      select: { id: true },
    })
    return !!member
  }

  async isChannelMember(userId: string, channelId: string): Promise<boolean> {
    const member = await this.prisma.channelMember.findUnique({
      where: { userId_channelId: { userId, channelId } },
      select: { id: true },
    })
    return !!member
  }

  async getUserWorkspaceIds(userId: string): Promise<string[]> {
    const members = await this.prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    })
    return members.map((m) => m.workspaceId)
  }

  async setUserOnline(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ONLINE' },
    })
  }

  async setUserOffline(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'OFFLINE' },
    })
  }

  async createMessage(data: {
    channelId: string
    userId: string
    content: string
    threadId?: string
  }) {
    return this.messagesRepository.create(data.channelId, data.userId, {
      content: data.content,
      threadId: data.threadId,
    })
  }

  async updateMessage(data: { messageId: string; userId: string; content: string }) {
    const message = await this.messagesRepository.findById(data.messageId)
    if (!message) return null

    const isAuthor = message.userId === data.userId
    if (!isAuthor) {
      const channel = await this.prisma.channel.findUnique({
        where: { id: message.channelId },
        select: { workspaceId: true },
      })
      const isOwner = channel
        ? await this.workspacesRepository.isOwner(data.userId, channel.workspaceId)
        : false
      if (!isOwner) return null
    }

    return this.messagesRepository.update(data.messageId, data.content)
  }

  async deleteMessage(data: { messageId: string; userId: string }) {
    const message = await this.messagesRepository.findById(data.messageId)
    if (!message) return null

    const isAuthor = message.userId === data.userId
    if (!isAuthor) return null

    return this.messagesRepository.softDelete(data.messageId)
  }
}
