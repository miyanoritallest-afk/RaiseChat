import { IsNotEmpty, IsString } from 'class-validator'

export class JoinWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  inviteCode!: string
}
