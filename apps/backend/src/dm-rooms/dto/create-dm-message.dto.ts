import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length } from 'class-validator'

export class CreateDmMessageDto {
  @ApiProperty({ example: 'こんにちは！', description: 'DMメッセージ本文（1〜2000文字）' })
  @IsString()
  @Length(1, 2000)
  content!: string
}
