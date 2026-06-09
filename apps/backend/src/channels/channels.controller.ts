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
  Put,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ChannelsService } from './channels.service'
import { CreateChannelDto } from './dto/create-channel.dto'
import { UpdateChannelDto } from './dto/update-channel.dto'
import { ReorderChannelsDto } from './dto/reorder-channels.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WorkspaceMemberGuard } from '../common/guards/workspace-member.guard'
import { WorkspaceOwnerGuard } from '../common/guards/workspace-owner.guard'
import { ChannelMemberGuard } from '../common/guards/channel-member.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

type JwtUser = { id: string; username: string }

@ApiTags('Channels')
@ApiBearerAuth('access-token')
@Controller('workspaces/:wsId/channels')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiOperation({ summary: 'チャンネル一覧' })
  @ApiResponse({ status: 200 })
  async getChannels(@Param('wsId') wsId: string, @CurrentUser() user: JwtUser) {
    return this.channelsService.getChannels(wsId, user.id)
  }

  @Put('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiOperation({ summary: 'チャンネル順序変更' })
  @ApiResponse({ status: 204 })
  async reorderChannels(
    @Param('wsId') wsId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: ReorderChannelsDto,
  ) {
    return this.channelsService.reorderChannels(wsId, user.id, dto)
  }

  @Post()
  @UseGuards(WorkspaceOwnerGuard)
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiOperation({ summary: 'チャンネル作成（オーナーのみ）' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 403, description: 'オーナー以外' })
  async createChannel(
    @Param('wsId') wsId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateChannelDto,
  ) {
    return this.channelsService.createChannel(wsId, user.id, dto)
  }

  @Get(':channelId')
  @UseGuards(ChannelMemberGuard)
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiOperation({ summary: 'チャンネル詳細' })
  @ApiResponse({ status: 200 })
  async getChannel(@Param('wsId') wsId: string, @Param('channelId') channelId: string) {
    return this.channelsService.getChannel(channelId, wsId)
  }

  @Get(':channelId/members')
  @UseGuards(ChannelMemberGuard)
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiOperation({ summary: 'チャンネルメンバー一覧' })
  @ApiResponse({ status: 200 })
  async getMembers(@Param('wsId') wsId: string, @Param('channelId') channelId: string) {
    return this.channelsService.getMembers(channelId, wsId)
  }

  @Patch(':channelId')
  @UseGuards(WorkspaceOwnerGuard)
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiOperation({ summary: 'チャンネル更新（オーナーのみ）' })
  @ApiResponse({ status: 200 })
  async updateChannel(
    @Param('wsId') wsId: string,
    @Param('channelId') channelId: string,
    @Body() dto: UpdateChannelDto,
  ) {
    return this.channelsService.updateChannel(channelId, wsId, dto)
  }

  @Delete(':channelId')
  @UseGuards(WorkspaceOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiOperation({ summary: 'チャンネル削除（オーナーのみ）' })
  @ApiResponse({ status: 204 })
  async deleteChannel(@Param('wsId') wsId: string, @Param('channelId') channelId: string) {
    return this.channelsService.deleteChannel(channelId, wsId)
  }

  @Post(':channelId/join')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiOperation({ summary: 'チャンネル参加' })
  @ApiResponse({ status: 200 })
  async joinChannel(
    @Param('wsId') wsId: string,
    @Param('channelId') channelId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.channelsService.joinChannel(channelId, wsId, user.id)
  }

  @Delete(':channelId/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiOperation({ summary: 'チャンネル退出' })
  @ApiResponse({ status: 204 })
  async leaveChannel(
    @Param('wsId') wsId: string,
    @Param('channelId') channelId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.channelsService.leaveChannel(channelId, wsId, user.id)
  }
}
