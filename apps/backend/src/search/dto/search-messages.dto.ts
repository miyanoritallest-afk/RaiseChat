import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator'
import { Type } from 'class-transformer'

export class SearchMessagesDto {
  @ApiProperty({ example: 'hello', description: '検索キーワード（2〜100文字）' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  q!: string

  @ApiPropertyOptional({ example: 'cursor-uuid', description: 'カーソルID（ページネーション用）' })
  @IsOptional()
  @IsString()
  cursor?: string

  @ApiPropertyOptional({ example: 20, description: '取得件数（1〜50）', minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number
}
