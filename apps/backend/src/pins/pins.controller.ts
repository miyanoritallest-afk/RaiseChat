import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { PinsService } from './pins.service'
import { AddPinDto } from './dto/add-pin.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ChannelMemberGuard } from '../common/guards/channel-member.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

type JwtUser = { id: string; username: string }

@ApiTags('Pins')
@ApiBearerAuth('access-token')
@Controller('workspaces/:wsId/channels/:channelId/pins')
@UseGuards(JwtAuthGuard, ChannelMemberGuard)
export class PinsController {
  constructor(private readonly pinsService: PinsService) {}

  @Get()
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiOperation({ summary: 'ピン一覧' })
  @ApiResponse({ status: 200 })
  async getPins(@Param('channelId') channelId: string) {
    return this.pinsService.getPins(channelId)
  }

  @Post()
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiOperation({ summary: 'メッセージをピン留め' })
  @ApiResponse({ status: 201 })
  async addPin(
    @Param('channelId') channelId: string,
    @Body() dto: AddPinDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.pinsService.addPin(dto.messageId, channelId, user.id)
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'wsId', description: 'ワークスペースID' })
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiParam({ name: 'messageId', description: 'メッセージID' })
  @ApiOperation({ summary: 'ピン解除' })
  @ApiResponse({ status: 204 })
  async removePin(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.pinsService.removePin(messageId, channelId, user.id)
  }
}
