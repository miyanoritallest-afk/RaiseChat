import { IsNotEmpty, IsString } from 'class-validator'

export class WsChannelJoinDto {
  @IsString()
  @IsNotEmpty()
  channelId: string
}
