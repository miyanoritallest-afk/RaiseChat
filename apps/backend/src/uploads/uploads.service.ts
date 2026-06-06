import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { FileType } from '@prisma/client'
import { S3Service } from './s3.service'

// 許可 MIME タイプと対応するファイルタイプ・拡張子
const ALLOWED: Record<string, { fileType: FileType; exts: string[] }> = {
  'image/jpeg': { fileType: 'IMAGE', exts: ['.jpg', '.jpeg'] },
  'image/png': { fileType: 'IMAGE', exts: ['.png'] },
  'image/gif': { fileType: 'IMAGE', exts: ['.gif'] },
  'image/webp': { fileType: 'IMAGE', exts: ['.webp'] },
  'video/mp4': { fileType: 'VIDEO', exts: ['.mp4'] },
  'video/webm': { fileType: 'VIDEO', exts: ['.webm'] },
}

// マジックバイトマップ（MIME 偽装対策）
const MAGIC: Array<{ mime: string; bytes: number[]; offset: number }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff], offset: 0 },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47], offset: 0 },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46], offset: 0 },
  { mime: 'image/webp', bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  { mime: 'video/mp4', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { mime: 'video/webm', bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0 },
]

const IMAGE_MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const VIDEO_MAX_BYTES = 100 * 1024 * 1024 // 100 MB

export type UploadResult = {
  fileUrl: string
  fileType: FileType
  fileName: string
  fileSize: number
}

@Injectable()
export class UploadsService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadFile(workspaceId: string, file: Express.Multer.File): Promise<UploadResult> {
    const mime = file.mimetype

    // MIME タイプ許可リストチェック
    const allowed = ALLOWED[mime]
    if (!allowed) {
      throw new HttpException(
        'このファイル形式はアップロードできません',
        HttpStatus.UNPROCESSABLE_ENTITY,
      )
    }

    // ファイルサイズ制限
    const maxBytes = allowed.fileType === 'IMAGE' ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES
    if (file.size > maxBytes) {
      throw new HttpException(
        `ファイルサイズが上限を超えています（上限: ${maxBytes / 1024 / 1024}MB）`,
        HttpStatus.PAYLOAD_TOO_LARGE,
      )
    }

    // マジックバイト検証（MIME 偽装対策）
    if (!this.validateMagicBytes(file.buffer, mime)) {
      throw new HttpException(
        'ファイルの内容が拡張子と一致しません',
        HttpStatus.UNPROCESSABLE_ENTITY,
      )
    }

    const key = await this.s3Service.upload(workspaceId, file.originalname, file.buffer, mime)

    // 署名付き URL を生成して返す（S3 バケットは非公開）
    const fileUrl = await this.s3Service.getSignedUrl(key)

    return {
      fileUrl,
      fileType: allowed.fileType,
      fileName: file.originalname,
      fileSize: file.size,
    }
  }

  private validateMagicBytes(buffer: Buffer, mime: string): boolean {
    const entry = MAGIC.find((m) => m.mime === mime)
    if (!entry) return false
    for (let i = 0; i < entry.bytes.length; i++) {
      if (buffer[entry.offset + i] !== entry.bytes[i]) return false
    }
    return true
  }
}
