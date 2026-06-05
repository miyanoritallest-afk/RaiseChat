import { IsString, Length } from 'class-validator'

export class UpdateDmMessageDto {
  @IsString()
  @Length(1, 2000)
  content!: string
}
