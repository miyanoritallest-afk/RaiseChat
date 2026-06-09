import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'My Team', description: 'ワークスペース名（1〜50文字）' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name!: string

  @ApiPropertyOptional({
    example: 'チームの作業スペース',
    description: 'ワークスペース説明（最大200文字）',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string
}
