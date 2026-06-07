import request from 'supertest'
import { INestApplication } from '@nestjs/common'

let counter = 0

export function uniqueUsername(prefix = 'u'): string {
  // MaxLength(20) 制約に合わせて短いユーザー名を生成 (例: u_3456_1)
  const ts = String(Date.now()).slice(-4)
  return `${prefix}_${ts}_${++counter}`
}

export async function createTestUser(
  app: INestApplication,
  username?: string,
): Promise<{ token: string; user: { id: string; username: string } }> {
  const name = username ?? uniqueUsername()
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ username: name, displayName: name, password: 'TestPass1!' })
    .expect(201)

  return res.body as { token: string; user: { id: string; username: string } }
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` }
}
