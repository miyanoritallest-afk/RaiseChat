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
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { MessagesService } from './messages.service'
import { CreateMessageDto } from './dto/create-message.dto'
import { UpdateMessageDto } from './dto/update-message.dto'
import { GetMessagesDto } from './dto/get-messages.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ChannelMemberGuard } from '../common/guards/channel-member.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

type JwtUser = { id: string; username: string }

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@Controller('workspaces/:wsId/channels/:channelId/messages')
@UseGuards(JwtAuthGuard, ChannelMemberGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiOperation({ summary: 'メッセージ一覧（カーソルページネーション）' })
  @ApiResponse({ status: 200 })
  async getMessages(
    @Param('channelId') channelId: string,
    @CurrentUser() user: JwtUser,
    @Query() dto: GetMessagesDto,
  ) {
    return this.messagesService.getMessages(channelId, user.id, dto)
  }

  @Post()
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiOperation({ summary: 'メッセージ送信' })
  @ApiResponse({ status: 201 })
  async createMessage(
    @Param('channelId') channelId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.createMessage(channelId, user.id, dto)
  }

  @Patch(':messageId')
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiParam({ name: 'messageId', description: 'メッセージID' })
  @ApiOperation({ summary: 'メッセージ編集' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: '本人以外' })
  async updateMessage(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.updateMessage(messageId, channelId, user.id, dto)
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiParam({ name: 'messageId', description: 'メッセージID' })
  @ApiOperation({ summary: 'メッセージ削除' })
  @ApiResponse({ status: 204 })
  async deleteMessage(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.messagesService.deleteMessage(messageId, channelId, user.id)
  }

  @Get(':messageId/replies')
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiParam({ name: 'messageId', description: 'スレッド親メッセージID' })
  @ApiOperation({ summary: 'スレッド返信一覧' })
  @ApiResponse({ status: 200 })
  async getReplies(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtUser,
    @Query() dto: GetMessagesDto,
  ) {
    return this.messagesService.getReplies(messageId, channelId, user.id, dto)
  }
}
