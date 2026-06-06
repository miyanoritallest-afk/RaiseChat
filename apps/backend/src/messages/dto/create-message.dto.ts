import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { FileType } from '@prisma/client'

export class AttachmentDto {
  // S3 キー（例: workspaceId/uuid.ext）を受け取る。URL ではなくキーのみ受け付けることで任意 URL 混入を防ぐ
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  s3Key!: string

  @IsEnum(FileType)
  fileType!: FileType

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string

  @IsInt()
  @Min(1)
  fileSize!: number
}

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content!: string

  @IsString()
  @IsOptional()
  threadId?: string

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[]
}
