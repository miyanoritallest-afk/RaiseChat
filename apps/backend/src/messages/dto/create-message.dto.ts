import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
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
  @ApiProperty({ example: 'wsId/uuid.jpg', description: 'S3キー（workspaceId/uuid.ext形式）' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  @Matches(/^[^./\\][^/\\]*\/[^./\\][^/\\]*$/, { message: 's3Key の形式が不正です' })
  s3Key!: string

  @ApiProperty({ enum: FileType, description: 'ファイル種別' })
  @IsEnum(FileType)
  fileType!: FileType

  @ApiProperty({ example: 'photo.jpg', description: 'ファイル名（最大255文字）' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string

  @ApiProperty({ example: 102400, description: 'ファイルサイズ（バイト）', minimum: 1 })
  @IsInt()
  @Min(1)
  fileSize!: number
}

export class CreateMessageDto {
  @ApiProperty({ example: 'Hello World!', description: 'メッセージ本文（1〜2000文字）' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content!: string

  @ApiPropertyOptional({ example: 'thread-uuid', description: 'スレッドID（返信の場合）' })
  @IsString()
  @IsOptional()
  threadId?: string

  @ApiPropertyOptional({
    type: () => AttachmentDto,
    isArray: true,
    description: '添付ファイル（最大10件）',
  })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[]
}
