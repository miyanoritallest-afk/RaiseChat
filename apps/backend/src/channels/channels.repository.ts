import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateChannelDto } from './dto/create-channel.dto'
import { UpdateChannelDto } from './dto/update-channel.dto'

@Injectable()
export class ChannelsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAccessibleChannels(workspaceId: string, userId: string) {
    return this.prisma.channel.findMany({
      where: {
        workspaceId,
        OR: [{ isPrivate: false }, { members: { some: { userId } } }],
      },
      select: {
        id: true,
        name: true,
        description: true,
        isPrivate: true,
        isDefault: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })
  }

  async findById(channelId: string) {
    return this.prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        description: true,
        isPrivate: true,
        isDefault: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
    })
  }

  async findMembersByChannelId(channelId: string) {
    return this.prisma.channelMember.findMany({
      where: { channelId },
      select: {
        id: true,
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

  async create(workspaceId: string, userId: string, dto: CreateChannelDto) {
    return this.prisma.channel.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
        isPrivate: dto.isPrivate ?? false,
        members: {
          create: { userId },
        },
      },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        description: true,
        isPrivate: true,
        isDefault: true,
        createdAt: true,
      },
    })
  }

  async update(channelId: string, dto: UpdateChannelDto) {
    return this.prisma.channel.update({
      where: { id: channelId },
      data: dto,
      select: {
        id: true,
        workspaceId: true,
        name: true,
        description: true,
        isPrivate: true,
        isDefault: true,
        createdAt: true,
      },
    })
  }

  async delete(channelId: string) {
    return this.prisma.channel.delete({ where: { id: channelId } })
  }

  async isMember(userId: string, channelId: string): Promise<boolean> {
    const member = await this.prisma.channelMember.findUnique({
      where: { userId_channelId: { userId, channelId } },
      select: { id: true },
    })
    return !!member
  }

  async addMember(userId: string, channelId: string) {
    return this.prisma.channelMember.create({
      data: { userId, channelId },
    })
  }

  async removeMember(userId: string, channelId: string) {
    return this.prisma.channelMember.delete({
      where: { userId_channelId: { userId, channelId } },
    })
  }

  async reorder(userId: string, channelIds: string[]) {
    await this.prisma.$transaction(
      channelIds.map((channelId, index) =>
        this.prisma.channelMember.update({
          where: { userId_channelId: { userId, channelId } },
          data: { position: index },
        }),
      ),
    )
  }

  async findAccessibleChannelsOrdered(workspaceId: string, userId: string) {
    const members = await this.prisma.channelMember.findMany({
      where: { userId, channel: { workspaceId } },
      orderBy: { position: 'asc' },
      select: { channelId: true },
    })
    const orderedIds = members.map((m) => m.channelId)

    const channels = await this.prisma.channel.findMany({
      where: {
        workspaceId,
        OR: [{ isPrivate: false }, { members: { some: { userId } } }],
      },
      select: {
        id: true,
        name: true,
        description: true,
        isPrivate: true,
        isDefault: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
    })

    const orderedSet = new Set(orderedIds)
    const ordered = orderedIds
      .map((id) => channels.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined)
    const rest = channels
      .filter((c) => !orderedSet.has(c.id))
      .sort((a, b) => a.name.localeCompare(b.name))

    return [...ordered, ...rest]
  }
}
