import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class UpdateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content: string
}
