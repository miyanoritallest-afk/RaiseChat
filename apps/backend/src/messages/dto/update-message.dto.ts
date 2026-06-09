import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class UpdateMessageDto {
  @ApiProperty({ example: '編集後のメッセージ', description: 'メッセージ本文（1〜2000文字）' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content!: string
}
