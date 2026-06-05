import { Module } from '@nestjs/common'
import { DmRoomsController, DmMessagesController } from './dm-rooms.controller'
import { DmRoomsService } from './dm-rooms.service'
import { DmRoomsRepository } from './dm-rooms.repository'
import { WorkspacesModule } from '../workspaces/workspaces.module'

@Module({
  imports: [WorkspacesModule],
  controllers: [DmRoomsController, DmMessagesController],
  providers: [DmRoomsService, DmRoomsRepository],
  exports: [DmRoomsRepository],
})
export class DmRoomsModule {}
