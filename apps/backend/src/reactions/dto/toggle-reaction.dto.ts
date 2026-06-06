import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class ToggleReactionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  emoji!: string
}
