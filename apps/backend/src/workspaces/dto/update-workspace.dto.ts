import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ description: 'ワークスペース名', minLength: 1, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string

  @ApiPropertyOptional({ description: '説明', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string
}
