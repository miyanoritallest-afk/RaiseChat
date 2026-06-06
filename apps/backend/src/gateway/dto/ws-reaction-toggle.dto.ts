import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class WsReactionToggleDto {
  @IsString()
  @IsNotEmpty()
  messageId!: string

  @IsString()
  @IsNotEmpty()
  channelId!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  emoji!: string
}
