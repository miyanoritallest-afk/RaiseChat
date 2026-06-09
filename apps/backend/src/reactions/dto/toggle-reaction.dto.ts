import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class ToggleReactionDto {
  @ApiProperty({ example: '👍', description: '絵文字（最大10文字）' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  emoji!: string
}
