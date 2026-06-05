import { Controller, Get, Patch, Param, Query, UseGuards, Request } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { GetNotificationsDto } from './dto/get-notifications.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

type AuthenticatedRequest = { user: { id: string; username: string } }

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** 自分の通知一覧をカーソルベースで取得 */
  @Get()
  getNotifications(@Request() req: AuthenticatedRequest, @Query() dto: GetNotificationsDto) {
    return this.notificationsService.getNotifications(req.user.id, dto)
  }

  /** 1件既読にする */
  @Patch(':id/read')
  markAsRead(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user.id)
  }

  /** 全件既読にする */
  @Patch('read-all')
  markAllAsRead(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.markAllAsRead(req.user.id)
  }
}
