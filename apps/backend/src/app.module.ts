import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { WorkspacesModule } from './workspaces/workspaces.module'
import { ChannelsModule } from './channels/channels.module'
import { MessagesModule } from './messages/messages.module'
import { DmRoomsModule } from './dm-rooms/dm-rooms.module'
import { NotificationsModule } from './notifications/notifications.module'
import { GatewayModule } from './gateway/gateway.module'
import { ReactionsModule } from './reactions/reactions.module'
import { PinsModule } from './pins/pins.module'
import { UploadsModule } from './uploads/uploads.module'
import { SearchModule } from './search/search.module'

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    ChannelsModule,
    MessagesModule,
    DmRoomsModule,
    NotificationsModule,
    GatewayModule,
    ReactionsModule,
    PinsModule,
    UploadsModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
