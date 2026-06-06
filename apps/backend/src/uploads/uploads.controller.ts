import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { UploadsService } from './uploads.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { WorkspaceMemberGuard } from '../common/guards/workspace-member.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

type JwtUser = { id: string; username: string }

// 許可 MIME タイプ（Multer fileFilter 用）
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
]

@Controller('workspaces/:wsId/uploads')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        // Multer 側では最大サイズの上限（100MB）だけ設定し、
        // 画像/動画の細かい制限は Service 層で行う
        fileSize: 100 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new Error('このファイル形式はアップロードできません'), false)
        }
      },
    }),
  )
  async uploadFile(
    @Param('wsId') wsId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() _user: JwtUser,
  ) {
    if (!file) {
      return { error: 'ファイルが見つかりません' }
    }
    return this.uploadsService.uploadFile(wsId, file)
  }
}
