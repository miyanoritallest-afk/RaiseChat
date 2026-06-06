import { Module } from '@nestjs/common'
import { PinsController } from './pins.controller'
import { PinsService } from './pins.service'
import { PinsRepository } from './pins.repository'
import { MessagesModule } from '../messages/messages.module'
import { WorkspacesModule } from '../workspaces/workspaces.module'

@Module({
  imports: [MessagesModule, WorkspacesModule],
  controllers: [PinsController],
  providers: [PinsService, PinsRepository],
  exports: [PinsService, PinsRepository],
})
export class PinsModule {}
