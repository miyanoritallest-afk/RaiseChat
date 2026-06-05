import { IsString } from 'class-validator'

export class WsDmJoinDto {
  @IsString()
  dmRoomId!: string
}
