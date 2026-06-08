import { Injectable } from '@nestjs/common'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import * as path from 'path'
import { randomUUID } from 'crypto'

@Injectable()
export class S3Service {
  private readonly client: S3Client | undefined
  private readonly bucket: string

  constructor() {
    const region = process.env.AWS_REGION
    const bucket = process.env.AWS_S3_BUCKET_NAME
    this.bucket = bucket ?? ''
    if (region && bucket) {
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
      this.client = new S3Client({
        region,
        ...(accessKeyId && secretAccessKey
          ? { credentials: { accessKeyId, secretAccessKey } }
          : {}),
      })
    }
  }

  private assertConfigured(): void {
    if (!this.client) {
      throw new Error('AWS_REGION and AWS_S3_BUCKET_NAME must be configured')
    }
  }

  async upload(
    workspaceId: string,
    originalName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    this.assertConfigured()
    // パストラバーサル対策: basename のみ使用
    const ext = path.extname(path.basename(originalName))
    const key = `${workspaceId}/${randomUUID()}${ext}`

    await this.client!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    )

    return key
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    this.assertConfigured()
    return getSignedUrl(this.client!, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn,
    })
  }

  async delete(key: string): Promise<void> {
    this.assertConfigured()
    await this.client!.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }
}
