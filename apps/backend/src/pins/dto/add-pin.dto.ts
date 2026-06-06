import { IsNotEmpty, IsString } from 'class-validator'

export class AddPinDto {
  @IsString()
  @IsNotEmpty()
  messageId!: string
}
