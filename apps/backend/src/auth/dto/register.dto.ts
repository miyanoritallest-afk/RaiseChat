import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username は英数字・アンダースコアのみ使用できます',
  })
  username!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  displayName!: string

  @IsString()
  @MinLength(8)
  password!: string
}
