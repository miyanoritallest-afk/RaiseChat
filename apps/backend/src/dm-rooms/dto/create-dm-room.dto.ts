import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsString, ArrayMinSize, IsOptional } from 'class-validator'

export class CreateDmRoomDto {
  // 自分以外の参加者IDリスト（1人なら1対1DM、2人以上ならグループDM）
  @ApiProperty({
    example: ['user-uuid-1'],
    description: '自分以外の参加者IDリスト（1人: 1対1DM、2人以上: グループDM）',
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  memberIds!: string[]

  // グループDMのみ名前を設定可能
  @ApiPropertyOptional({
    example: 'プロジェクトDM',
    description: 'グループDM名（グループDM時のみ）',
  })
  @IsOptional()
  @IsString()
  name?: string
}
