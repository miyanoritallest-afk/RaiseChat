import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length } from 'class-validator'

export class UpdateDmMessageDto {
  @ApiProperty({ example: '編集後のDMメッセージ', description: 'DMメッセージ本文（1〜2000文字）' })
  @IsString()
  @Length(1, 2000)
  content!: string
}
