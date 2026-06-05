import { IsString, Length } from 'class-validator'

export class WsDmMessageSendDto {
  @IsString()
  dmRoomId!: string

  @IsString()
  @Length(1, 2000)
  content!: string
}
