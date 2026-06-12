import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class WorkspacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyByUserId(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        members: { some: { userId } },
      },
      select: {
        id: true,
        name: true,
        description: true,
        iconUrl: true,
        inviteCode: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findById(workspaceId: string) {
    return this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        description: true,
        iconUrl: true,
        inviteCode: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
    })
  }

  async findMembersByWorkspaceId(workspaceId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  async createWithGeneralChannel(data: { name: string; description?: string; ownerId: string }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const workspace = await tx.workspace.create({
        data: {
          name: data.name,
          description: data.description,
          members: {
            create: { userId: data.ownerId, role: 'OWNER' },
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          iconUrl: true,
          inviteCode: true,
          createdAt: true,
          _count: { select: { members: true } },
        },
      })

      await tx.channel.create({
        data: {
          workspaceId: workspace.id,
          name: 'general',
          isDefault: true,
          members: {
            create: { userId: data.ownerId },
          },
        },
      })

      return workspace
    })
  }

  async joinByInviteCode(inviteCode: string, userId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const workspace = await tx.workspace.findUnique({
        where: { inviteCode },
        select: {
          id: true,
          name: true,
          description: true,
          iconUrl: true,
          inviteCode: true,
          createdAt: true,
        },
      })
      if (!workspace) return null

      await tx.workspaceMember.upsert({
        where: { userId_workspaceId: { userId, workspaceId: workspace.id } },
        create: { userId, workspaceId: workspace.id, role: 'MEMBER' },
        update: {},
      })

      const defaultChannels = await tx.channel.findMany({
        where: { workspaceId: workspace.id, isDefault: true },
        select: { id: true },
      })

      for (const ch of defaultChannels) {
        await tx.channelMember.upsert({
          where: { userId_channelId: { userId, channelId: ch.id } },
          create: { userId, channelId: ch.id },
          update: {},
        })
      }

      const joinedUser = await tx.user.findUnique({
        where: { id: userId },
        select: { displayName: true },
      })

      if (defaultChannels.length > 0 && joinedUser) {
        await tx.message.create({
          data: {
            channelId: defaultChannels[0].id,
            userId,
            content: `${joinedUser.displayName} さんがワークスペースに参加しました！`,
          },
        })
      }

      return tx.workspace.findUnique({
        where: { id: workspace.id },
        select: {
          id: true,
          name: true,
          description: true,
          iconUrl: true,
          inviteCode: true,
          createdAt: true,
          _count: { select: { members: true } },
        },
      })
    })
  }

  async removeMember(workspaceId: string, userId: string) {
    return this.prisma.workspaceMember.delete({
      where: { userId_workspaceId: { userId, workspaceId } },
    })
  }

  async update(workspaceId: string, data: { name?: string; description?: string }) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        iconUrl: true,
        inviteCode: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
    })
  }

  async delete(workspaceId: string) {
    return this.prisma.workspace.delete({ where: { id: workspaceId } })
  }

  async isOwner(userId: string, workspaceId: string): Promise<boolean> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      select: { role: true },
    })
    return member?.role === 'OWNER'
  }
}
