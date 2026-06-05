import { Module } from '@nestjs/common'
import { MessagesController } from './messages.controller'
import { MessagesService } from './messages.service'
import { MessagesRepository } from './messages.repository'
import { WorkspacesModule } from '../workspaces/workspaces.module'

@Module({
  imports: [WorkspacesModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesRepository],
  exports: [MessagesRepository],
})
export class MessagesModule {}
