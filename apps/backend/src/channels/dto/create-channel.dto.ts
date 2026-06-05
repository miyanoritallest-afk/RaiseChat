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
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'チャンネル名は英小文字・数字・ハイフン・アンダースコアのみ使用できます',
  })
  name: string

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string
}
