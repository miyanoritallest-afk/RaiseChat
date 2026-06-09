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
  Query,
  UseGuards,
} from '@nestjs/common'
import { DmRoomsService } from './dm-rooms.service'
import { CreateDmRoomDto } from './dto/create-dm-room.dto'
import { GetDmMessagesDto } from './dto/get-dm-messages.dto'
import { UpdateDmMessageDto } from './dto/update-dm-message.dto'
import { UpdateDmRoomDto } from './dto/update-dm-room.dto'
import { CreateDmMessageDto } from './dto/create-dm-message.dto'
import { ReorderDmRoomsDto } from './dto/reorder-dm-rooms.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WorkspaceMemberGuard } from '../common/guards/workspace-member.guard'
import { DmRoomMemberGuard } from '../common/guards/dm-room-member.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

type JwtUser = { id: string; username: string }

// ワークスペースコンテキストでのDM部屋管理（作成・一覧）
@Controller('workspaces/:wsId/dm-rooms')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class DmRoomsController {
  constructor(private readonly dmRoomsService: DmRoomsService) {}

  @Get()
  async getDmRooms(@CurrentUser() user: JwtUser) {
    return this.dmRoomsService.getDmRooms(user.id)
  }

  @Post()
  async createDmRoom(@CurrentUser() user: JwtUser, @Body() dto: CreateDmRoomDto) {
    return this.dmRoomsService.createDmRoom(user.id, dto)
  }

  @Put('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorderDmRooms(@CurrentUser() user: JwtUser, @Body() dto: ReorderDmRoomsDto) {
    return this.dmRoomsService.reorderDmRooms(user.id, dto)
  }
}

// DM部屋単体への操作（DmRoomMemberGuardで認可）
@Controller('dm-rooms/:dmRoomId')
@UseGuards(JwtAuthGuard, DmRoomMemberGuard)
export class DmRoomController {
  constructor(private readonly dmRoomsService: DmRoomsService) {}

  @Patch()
  async updateDmRoom(
    @Param('dmRoomId') dmRoomId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateDmRoomDto,
  ) {
    return this.dmRoomsService.updateDmRoom(dmRoomId, user.id, dto)
  }
}

// DM部屋内のメッセージ操作（DmRoomMemberGuardで認可）
@Controller('dm-rooms/:dmRoomId/messages')
@UseGuards(JwtAuthGuard, DmRoomMemberGuard)
export class DmMessagesController {
  constructor(private readonly dmRoomsService: DmRoomsService) {}

  @Get()
  async getDmMessages(@Param('dmRoomId') dmRoomId: string, @Query() dto: GetDmMessagesDto) {
    return this.dmRoomsService.getDmMessages(dmRoomId, dto)
  }

  @Post()
  async createDmMessage(
    @Param('dmRoomId') dmRoomId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateDmMessageDto,
  ) {
    return this.dmRoomsService.createDmMessage(dmRoomId, user.id, dto)
  }

  @Patch(':messageId')
  async updateDmMessage(
    @Param('dmRoomId') dmRoomId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateDmMessageDto,
  ) {
    return this.dmRoomsService.updateDmMessage(messageId, dmRoomId, user.id, dto)
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDmMessage(
    @Param('dmRoomId') dmRoomId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.dmRoomsService.deleteDmMessage(messageId, dmRoomId, user.id)
  }
}
