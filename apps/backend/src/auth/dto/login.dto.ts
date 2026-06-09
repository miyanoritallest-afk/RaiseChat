import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class LoginDto {
  @ApiProperty({ example: 'john_doe', description: 'ユーザー名' })
  @IsString()
  @IsNotEmpty()
  username!: string

  @ApiProperty({ example: 'password123', description: 'パスワード' })
  @IsString()
  @IsNotEmpty()
  password!: string
}
