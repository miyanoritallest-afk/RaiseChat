import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { WorkspacesModule } from './workspaces/workspaces.module'
import { ChannelsModule } from './channels/channels.module'
import { MessagesModule } from './messages/messages.module'
import { GatewayModule } from './gateway/gateway.module'

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    ChannelsModule,
    MessagesModule,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
