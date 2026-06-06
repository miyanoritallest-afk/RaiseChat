import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ReactionsService } from './reactions.service'
import { ToggleReactionDto } from './dto/toggle-reaction.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ChannelMemberGuard } from '../common/guards/channel-member.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

type JwtUser = { id: string; username: string }

@Controller('workspaces/:wsId/channels/:channelId/messages/:messageId/reactions')
@UseGuards(JwtAuthGuard, ChannelMemberGuard)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  async addReaction(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body() dto: ToggleReactionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.reactionsService.toggleReaction(messageId, channelId, user.id, dto.emoji)
  }

  @Delete(':emoji')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeReaction(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.reactionsService.toggleReaction(
      messageId,
      channelId,
      user.id,
      decodeURIComponent(emoji),
    )
  }
}
