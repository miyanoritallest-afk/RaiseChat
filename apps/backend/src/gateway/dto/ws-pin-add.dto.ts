import { IsNotEmpty, IsString } from 'class-validator'

export class WsPinAddDto {
  @IsString()
  @IsNotEmpty()
  channelId!: string

  @IsString()
  @IsNotEmpty()
  messageId!: string

  @IsString()
  @IsNotEmpty()
  workspaceId!: string
}
