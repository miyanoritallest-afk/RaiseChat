import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class UpdateDmRoomDto {
  @ApiProperty({ example: '新しいグループ名', description: 'グループDM名（1〜80文字）' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string
}
