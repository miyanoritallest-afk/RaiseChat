import { IsArray, IsString, ArrayMinSize, IsOptional } from 'class-validator'

export class CreateDmRoomDto {
  // 自分以外の参加者IDリスト（1人なら1対1DM、2人以上ならグループDM）
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  memberIds!: string[]

  // グループDMのみ名前を設定可能
  @IsOptional()
  @IsString()
  name?: string
}
