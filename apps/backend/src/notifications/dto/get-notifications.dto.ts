import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class GetNotificationsDto {
  @ApiPropertyOptional({ example: 'cursor-uuid', description: 'カーソルID（ページネーション用）' })
  @IsOptional()
  @IsString()
  cursor?: string

  @ApiPropertyOptional({ example: 20, description: '取得件数（1〜50）', minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number
}
