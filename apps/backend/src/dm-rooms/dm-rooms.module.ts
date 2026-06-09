import { Module } from '@nestjs/common'
import { DmRoomsController, DmRoomController, DmMessagesController } from './dm-rooms.controller'
import { DmRoomsService } from './dm-rooms.service'
import { DmRoomsRepository } from './dm-rooms.repository'
import { WorkspacesModule } from '../workspaces/workspaces.module'
import { UploadsModule } from '../uploads/uploads.module'

@Module({
  imports: [WorkspacesModule, UploadsModule],
  controllers: [DmRoomsController, DmRoomController, DmMessagesController],
  providers: [DmRoomsService, DmRoomsRepository],
  exports: [DmRoomsRepository],
})
export class DmRoomsModule {}
