import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class GetMessagesDto {
  @ApiPropertyOptional({ example: 'cursor-uuid', description: 'カーソルID（ページネーション用）' })
  @IsString()
  @IsOptional()
  cursor?: string

  @ApiPropertyOptional({ example: 20, description: '取得件数（1〜50）', minimum: 1, maximum: 50 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number
}
