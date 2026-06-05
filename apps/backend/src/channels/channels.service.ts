import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { ChannelsRepository } from './channels.repository'
import { CreateChannelDto } from './dto/create-channel.dto'
import { UpdateChannelDto } from './dto/update-channel.dto'

@Injectable()
export class ChannelsService {
  constructor(private readonly channelsRepository: ChannelsRepository) {}

  async getChannels(workspaceId: string, userId: string) {
    return this.channelsRepository.findAccessibleChannels(workspaceId, userId)
  }

  async getChannel(channelId: string) {
    const channel = await this.channelsRepository.findById(channelId)
    if (!channel) {
      throw new HttpException('チャンネルが見つかりません', HttpStatus.NOT_FOUND)
    }
    return channel
  }

  async getMembers(channelId: string) {
    return this.channelsRepository.findMembersByChannelId(channelId)
  }

  async createChannel(workspaceId: string, userId: string, dto: CreateChannelDto) {
    return this.channelsRepository.create(workspaceId, userId, dto)
  }

  async updateChannel(channelId: string, dto: UpdateChannelDto) {
    const channel = await this.channelsRepository.findById(channelId)
    if (!channel) {
      throw new HttpException('チャンネルが見つかりません', HttpStatus.NOT_FOUND)
    }
    return this.channelsRepository.update(channelId, dto)
  }

  async deleteChannel(channelId: string) {
    const channel = await this.channelsRepository.findById(channelId)
    if (!channel) {
      throw new HttpException('チャンネルが見つかりません', HttpStatus.NOT_FOUND)
    }
    if (channel.isDefault) {
      throw new HttpException('デフォルトチャンネルは削除できません', HttpStatus.FORBIDDEN)
    }
    return this.channelsRepository.delete(channelId)
  }

  async joinChannel(channelId: string, userId: string) {
    const channel = await this.channelsRepository.findById(channelId)
    if (!channel) {
      throw new HttpException('チャンネルが見つかりません', HttpStatus.NOT_FOUND)
    }
    if (channel.isPrivate) {
      throw new HttpException('プライベートチャンネルには招待が必要です', HttpStatus.FORBIDDEN)
    }
    const already = await this.channelsRepository.isMember(userId, channelId)
    if (already) {
      throw new HttpException('既にチャンネルに参加しています', HttpStatus.CONFLICT)
    }
    return this.channelsRepository.addMember(userId, channelId)
  }

  async leaveChannel(channelId: string, userId: string) {
    const isMember = await this.channelsRepository.isMember(userId, channelId)
    if (!isMember) {
      throw new HttpException('チャンネルに参加していません', HttpStatus.NOT_FOUND)
    }
    return this.channelsRepository.removeMember(userId, channelId)
  }
}
