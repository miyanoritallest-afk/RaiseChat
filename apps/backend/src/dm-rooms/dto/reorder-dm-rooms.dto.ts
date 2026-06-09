import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsString } from 'class-validator'

export class ReorderDmRoomsDto {
  @ApiProperty({ example: ['id1', 'id2', 'id3'], description: 'DM部屋IDを表示順に並べた配列' })
  @IsArray()
  @IsString({ each: true })
  dmRoomIds!: string[]
}
