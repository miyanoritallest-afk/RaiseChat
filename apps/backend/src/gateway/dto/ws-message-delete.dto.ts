import { IsNotEmpty, IsString } from 'class-validator'

export class WsMessageDeleteDto {
  @IsString()
  @IsNotEmpty()
  messageId: string
}
