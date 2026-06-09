import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class UpdateChannelDto {
  @ApiPropertyOptional({
    example: 'random',
    description: 'チャンネル名（英小文字・数字・ハイフン・アンダースコア、1〜50文字）',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'チャンネル名は英小文字・数字・ハイフン・アンダースコアのみ使用できます',
  })
  name?: string

  @ApiPropertyOptional({
    example: '雑談用チャンネル',
    description: 'チャンネル説明（最大200文字）',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string
}
