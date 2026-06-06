import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { AttachmentDto } from '../../messages/dto/create-message.dto'

export class WsMessageSendDto {
  @IsString()
  @IsNotEmpty()
  channelId!: string

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
