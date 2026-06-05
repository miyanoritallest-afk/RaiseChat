import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class WsMessageSendDto {
  @IsString()
  @IsNotEmpty()
  channelId: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content: string

  @IsString()
  @IsOptional()
  threadId?: string
}
