import { IsArray, IsString } from 'class-validator'

export class ReorderDmRoomsDto {
  @IsArray()
  @IsString({ each: true })
  dmRoomIds!: string[]
}
