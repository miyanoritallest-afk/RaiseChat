import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { FileType } from '@prisma/client'

export class AttachmentDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  fileUrl!: string

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
