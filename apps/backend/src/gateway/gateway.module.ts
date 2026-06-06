import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ChatGateway } from './chat.gateway'
import { GatewayService } from './gateway.service'
import { MessagesModule } from '../messages/messages.module'
import { WorkspacesModule } from '../workspaces/workspaces.module'
import { DmRoomsModule } from '../dm-rooms/dm-rooms.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET
        if (!secret) throw new Error('JWT_SECRET is not configured')
        return { secret, signOptions: { expiresIn: '7d' } }
      },
    }),
    MessagesModule,
    WorkspacesModule,
    DmRoomsModule,
    NotificationsModule,
  ],
  providers: [ChatGateway, GatewayService],
})
export class GatewayModule {}
