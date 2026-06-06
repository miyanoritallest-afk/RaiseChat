import { IsString, Length } from 'class-validator'

export class CreateDmMessageDto {
  @IsString()
  @Length(1, 2000)
  content!: string
}
