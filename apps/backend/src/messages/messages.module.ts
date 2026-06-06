import { Module } from '@nestjs/common'
import { MessagesController } from './messages.controller'
import { MessagesService } from './messages.service'
import { MessagesRepository } from './messages.repository'
import { WorkspacesModule } from '../workspaces/workspaces.module'
import { ChannelsModule } from '../channels/channels.module'
import { UploadsModule } from '../uploads/uploads.module'

@Module({
  imports: [WorkspacesModule, ChannelsModule, UploadsModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesRepository],
  exports: [MessagesRepository],
})
export class MessagesModule {}
