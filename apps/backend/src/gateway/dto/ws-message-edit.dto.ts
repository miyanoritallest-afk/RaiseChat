import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class WsMessageEditDto {
  @IsString()
  @IsNotEmpty()
  messageId: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content: string
}
