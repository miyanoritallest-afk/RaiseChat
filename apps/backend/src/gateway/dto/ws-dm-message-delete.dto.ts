import { IsString } from 'class-validator'

export class WsDmMessageDeleteDto {
  @IsString()
  dmRoomId!: string

  @IsString()
  messageId!: string
}
