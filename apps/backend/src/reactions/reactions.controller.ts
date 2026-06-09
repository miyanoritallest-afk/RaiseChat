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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ReactionsService } from './reactions.service'
import { ToggleReactionDto } from './dto/toggle-reaction.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ChannelMemberGuard } from '../common/guards/channel-member.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

type JwtUser = { id: string; username: string }

@ApiTags('Reactions')
@ApiBearerAuth('access-token')
@Controller('workspaces/:wsId/channels/:channelId/messages/:messageId/reactions')
@UseGuards(JwtAuthGuard, ChannelMemberGuard)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiParam({ name: 'messageId', description: 'メッセージID' })
  @ApiOperation({ summary: 'リアクション追加/削除トグル' })
  @ApiResponse({ status: 201 })
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
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiParam({ name: 'messageId', description: 'メッセージID' })
  @ApiParam({ name: 'emoji', description: '絵文字（URLエンコード済み）' })
  @ApiOperation({ summary: 'リアクション削除' })
  @ApiResponse({ status: 204 })
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
