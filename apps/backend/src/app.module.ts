import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { WorkspacesModule } from './workspaces/workspaces.module'
import { ChannelsModule } from './channels/channels.module'

@Module({
  imports: [PrismaModule, AuthModule, WorkspacesModule, ChannelsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
