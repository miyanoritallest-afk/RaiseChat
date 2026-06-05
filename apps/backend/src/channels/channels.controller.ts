import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ChannelsService } from './channels.service'
import { CreateChannelDto } from './dto/create-channel.dto'
import { UpdateChannelDto } from './dto/update-channel.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WorkspaceMemberGuard } from '../common/guards/workspace-member.guard'
import { WorkspaceOwnerGuard } from '../common/guards/workspace-owner.guard'
import { ChannelMemberGuard } from '../common/guards/channel-member.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

type JwtUser = { id: string; username: string }

@Controller('workspaces/:wsId/channels')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  async getChannels(@Param('wsId') wsId: string, @CurrentUser() user: JwtUser) {
    return this.channelsService.getChannels(wsId, user.id)
  }

  @Post()
  @UseGuards(WorkspaceOwnerGuard)
  async createChannel(
    @Param('wsId') wsId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateChannelDto,
  ) {
    return this.channelsService.createChannel(wsId, user.id, dto)
  }

  @Get(':channelId')
  @UseGuards(ChannelMemberGuard)
  async getChannel(@Param('channelId') channelId: string) {
    return this.channelsService.getChannel(channelId)
  }

  @Get(':channelId/members')
  @UseGuards(ChannelMemberGuard)
  async getMembers(@Param('channelId') channelId: string) {
    return this.channelsService.getMembers(channelId)
  }

  @Patch(':channelId')
  @UseGuards(WorkspaceOwnerGuard)
  async updateChannel(@Param('channelId') channelId: string, @Body() dto: UpdateChannelDto) {
    return this.channelsService.updateChannel(channelId, dto)
  }

  @Delete(':channelId')
  @UseGuards(WorkspaceOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChannel(@Param('channelId') channelId: string) {
    return this.channelsService.deleteChannel(channelId)
  }

  @Post(':channelId/join')
  @HttpCode(HttpStatus.OK)
  async joinChannel(@Param('channelId') channelId: string, @CurrentUser() user: JwtUser) {
    return this.channelsService.joinChannel(channelId, user.id)
  }

  @Delete(':channelId/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveChannel(@Param('channelId') channelId: string, @CurrentUser() user: JwtUser) {
    return this.channelsService.leaveChannel(channelId, user.id)
  }
}
