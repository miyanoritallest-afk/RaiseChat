import { IsNotEmpty, IsString } from 'class-validator'

export class WsPinRemoveDto {
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
