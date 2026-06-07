import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { FileType } from '.prisma/client'

export class AttachmentDto {
  // S3 キー（例: workspaceId/uuid.ext）のみ受け付ける。パストラバーサル文字（.. / \）を禁止
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  @Matches(/^[^./\\][^/\\]*\/[^./\\][^/\\]*$/, { message: 's3Key の形式が不正です' })
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
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[]
}
