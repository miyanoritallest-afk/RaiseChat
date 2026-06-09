import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'ユーザー名（3〜20文字、英数字・アンダースコア）',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username は英数字・アンダースコアのみ使用できます',
  })
  username!: string

  @ApiProperty({ example: 'John Doe', description: '表示名（最大50文字）' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  displayName!: string

  @ApiProperty({ example: 'password123', description: 'パスワード（8文字以上）' })
  @IsString()
  @MinLength(8)
  password!: string
}
