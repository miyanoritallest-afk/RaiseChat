import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class AddPinDto {
  @ApiProperty({ example: 'message-uuid', description: 'ピン留めするメッセージID' })
  @IsString()
  @IsNotEmpty()
  messageId!: string
}
