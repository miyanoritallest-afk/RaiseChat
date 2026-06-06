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
import { PinsService } from './pins.service'
import { AddPinDto } from './dto/add-pin.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ChannelMemberGuard } from '../common/guards/channel-member.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

type JwtUser = { id: string; username: string }

@Controller('workspaces/:wsId/channels/:channelId/pins')
@UseGuards(JwtAuthGuard, ChannelMemberGuard)
export class PinsController {
  constructor(private readonly pinsService: PinsService) {}

  @Get()
  async getPins(@Param('channelId') channelId: string) {
    return this.pinsService.getPins(channelId)
  }

  @Post()
  async addPin(
    @Param('channelId') channelId: string,
    @Body() dto: AddPinDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.pinsService.addPin(dto.messageId, channelId, user.id)
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePin(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.pinsService.removePin(messageId, channelId, user.id)
  }
}
