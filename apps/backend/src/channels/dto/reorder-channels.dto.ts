import { IsArray, IsString } from 'class-validator'

export class ReorderChannelsDto {
  @IsArray()
  @IsString({ each: true })
  channelIds!: string[]
}
