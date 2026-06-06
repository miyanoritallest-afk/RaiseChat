import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { FileType } from '@prisma/client'
import { S3Service } from './s3.service'

// 許可 MIME タイプと対応するファイルタイプ
const ALLOWED: Record<string, { fileType: FileType }> = {
  'image/jpeg': { fileType: 'IMAGE' },
  'image/png': { fileType: 'IMAGE' },
  'image/gif': { fileType: 'IMAGE' },
  'image/webp': { fileType: 'IMAGE' },
  'video/mp4': { fileType: 'VIDEO' },
  'video/webm': { fileType: 'VIDEO' },
}

// マジックバイトマップ（MIME 偽装対策）
// WebP は RIFF????WEBP 構造: offset 0 に RIFF + offset 8 に WEBP の両方を確認する
const MAGIC: Array<{ mime: string; checks: Array<{ bytes: number[]; offset: number }> }> = [
  { mime: 'image/jpeg', checks: [{ bytes: [0xff, 0xd8, 0xff], offset: 0 }] },
  { mime: 'image/png', checks: [{ bytes: [0x89, 0x50, 0x4e, 0x47], offset: 0 }] },
  { mime: 'image/gif', checks: [{ bytes: [0x47, 0x49, 0x46], offset: 0 }] },
  {
    mime: 'image/webp',
    checks: [
      { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF
      { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // WEBP
    ],
  },
  { mime: 'video/mp4', checks: [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }] },
  { mime: 'video/webm', checks: [{ bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0 }] },
]

const IMAGE_MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const VIDEO_MAX_BYTES = 100 * 1024 * 1024 // 100 MB

export type UploadResult = {
  s3Key: string // DB に永続保存するキー（署名なし）
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

    const s3Key = await this.s3Service.upload(workspaceId, file.originalname, file.buffer, mime)

    // s3Key のみ返す。署名付き URL は DB 保存せず、メッセージ取得時に都度生成する
    return {
      s3Key,
      fileType: allowed.fileType,
      fileName: file.originalname,
      fileSize: file.size,
    }
  }

  private validateMagicBytes(buffer: Buffer, mime: string): boolean {
    const entry = MAGIC.find((m) => m.mime === mime)
    if (!entry) return false
    return entry.checks.every(({ bytes, offset }) => {
      if (buffer.length < offset + bytes.length) return false
      return bytes.every((byte, i) => buffer[offset + i] === byte)
    })
  }
}
