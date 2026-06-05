import { IsString, Length } from 'class-validator'

export class WsDmMessageEditDto {
  @IsString()
  dmRoomId!: string

  @IsString()
  messageId!: string

  @IsString()
  @Length(1, 2000)
  content!: string
}
