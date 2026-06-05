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
import { MessagesService } from './messages.service'
import { CreateMessageDto } from './dto/create-message.dto'
import { UpdateMessageDto } from './dto/update-message.dto'
import { GetMessagesDto } from './dto/get-messages.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ChannelMemberGuard } from '../common/guards/channel-member.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

type JwtUser = { id: string; username: string }

@Controller('workspaces/:wsId/channels/:channelId/messages')
@UseGuards(JwtAuthGuard, ChannelMemberGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async getMessages(
    @Param('channelId') channelId: string,
    @CurrentUser() user: JwtUser,
    @Query() dto: GetMessagesDto,
  ) {
    return this.messagesService.getMessages(channelId, user.id, dto)
  }

  @Post()
  async createMessage(
    @Param('channelId') channelId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.createMessage(channelId, user.id, dto)
  }

  @Patch(':messageId')
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
  async deleteMessage(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.messagesService.deleteMessage(messageId, channelId, user.id)
  }
}
