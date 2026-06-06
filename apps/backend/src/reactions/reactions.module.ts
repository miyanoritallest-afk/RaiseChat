import { Module } from '@nestjs/common'
import { ReactionsController } from './reactions.controller'
import { ReactionsService } from './reactions.service'
import { ReactionsRepository } from './reactions.repository'
import { MessagesModule } from '../messages/messages.module'

@Module({
  imports: [MessagesModule],
  controllers: [ReactionsController],
  providers: [ReactionsService, ReactionsRepository],
  exports: [ReactionsService, ReactionsRepository],
})
export class ReactionsModule {}
