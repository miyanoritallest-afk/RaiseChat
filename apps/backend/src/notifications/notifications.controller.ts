import { Controller, Get, Patch, Param, Query, UseGuards, Request } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { NotificationsService } from './notifications.service'
import { GetNotificationsDto } from './dto/get-notifications.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

type AuthenticatedRequest = { user: { id: string; username: string } }

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '通知一覧（カーソルページネーション）' })
  @ApiResponse({ status: 200 })
  getNotifications(@Request() req: AuthenticatedRequest, @Query() dto: GetNotificationsDto) {
    return this.notificationsService.getNotifications(req.user.id, dto)
  }

  @Patch(':id/read')
  @ApiParam({ name: 'id', description: '通知ID' })
  @ApiOperation({ summary: '通知1件を既読にする' })
  @ApiResponse({ status: 200 })
  markAsRead(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.id)
  }

  @Patch('read-all')
  @ApiOperation({ summary: '全通知を既読にする' })
  @ApiResponse({ status: 200 })
  markAllAsRead(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.markAllAsRead(req.user.id)
  }

  @Patch('read-by-channel/:channelId')
  @ApiParam({ name: 'channelId', description: 'チャンネルID' })
  @ApiOperation({ summary: '特定チャンネルの通知を全既読にする' })
  @ApiResponse({ status: 200 })
  markReadByChannel(@Request() req: AuthenticatedRequest, @Param('channelId') channelId: string) {
    return this.notificationsService.markReadByChannel(req.user.id, channelId)
  }

  @Patch('read-by-dm-room/:dmRoomId')
  @ApiParam({ name: 'dmRoomId', description: 'DM部屋ID' })
  @ApiOperation({ summary: '特定DM部屋の通知を全既読にする' })
  @ApiResponse({ status: 200 })
  markReadByDmRoom(@Request() req: AuthenticatedRequest, @Param('dmRoomId') dmRoomId: string) {
    return this.notificationsService.markReadByDmRoom(req.user.id, dmRoomId)
  }
}
