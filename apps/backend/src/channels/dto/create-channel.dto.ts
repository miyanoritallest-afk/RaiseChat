import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CreateChannelDto {
  @ApiProperty({
    example: 'general',
    description: 'チャンネル名（英小文字・数字・ハイフン・アンダースコア、1〜50文字）',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'チャンネル名は英小文字・数字・ハイフン・アンダースコアのみ使用できます',
  })
  name!: string

  @ApiPropertyOptional({ example: false, description: 'プライベートチャンネルフラグ' })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean

  @ApiPropertyOptional({
    example: '全体連絡用チャンネル',
    description: 'チャンネル説明（最大200文字）',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string
}
