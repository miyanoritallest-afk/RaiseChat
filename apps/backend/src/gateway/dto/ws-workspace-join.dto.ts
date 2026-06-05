import { IsNotEmpty, IsString } from 'class-validator'

export class WsWorkspaceJoinDto {
  @IsString()
  @IsNotEmpty()
  workspaceId!: string
}
