import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name!: string

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string
}
