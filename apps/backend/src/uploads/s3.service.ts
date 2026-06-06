import { Injectable } from '@nestjs/common'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import * as path from 'path'
import { randomUUID } from 'crypto'

@Injectable()
export class S3Service {
  private readonly client: S3Client
  private readonly bucket: string

  constructor() {
    const region = process.env.AWS_REGION
    const bucket = process.env.AWS_S3_BUCKET_NAME
    if (!region || !bucket) {
      throw new Error('AWS_REGION and AWS_S3_BUCKET_NAME must be configured')
    }
    this.bucket = bucket
    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
    })
  }

  async upload(
    workspaceId: string,
    originalName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    // パストラバーサル対策: basename のみ使用
    const ext = path.extname(path.basename(originalName))
    const key = `${workspaceId}/${randomUUID()}${ext}`

    await this.client.send(
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
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn,
    })
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }
}
