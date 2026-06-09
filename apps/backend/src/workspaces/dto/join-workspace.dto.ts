import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class JoinWorkspaceDto {
  @ApiProperty({ example: 'ABC123', description: '招待コード' })
  @IsString()
  @IsNotEmpty()
  inviteCode!: string
}
