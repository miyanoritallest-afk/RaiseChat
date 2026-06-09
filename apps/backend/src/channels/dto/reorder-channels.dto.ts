import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsString } from 'class-validator'

export class ReorderChannelsDto {
  @ApiProperty({ example: ['id1', 'id2', 'id3'], description: 'チャンネルIDを表示順に並べた配列' })
  @IsArray()
  @IsString({ each: true })
  channelIds!: string[]
}
