import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { authHeader } from './auth.helper'

export async function createTestWorkspace(
  app: INestApplication,
  token: string,
  name?: string,
): Promise<{ id: string; name: string; inviteCode: string }> {
  const res = await request(app.getHttpServer())
    .post('/workspaces')
    .set(authHeader(token))
    .send({ name: name ?? `workspace-${Date.now()}` })
    .expect(201)

  return res.body as { id: string; name: string; inviteCode: string }
}

export async function createTestChannel(
  app: INestApplication,
  token: string,
  workspaceId: string,
  name?: string,
  isPrivate = false,
): Promise<{ id: string; name: string }> {
  const res = await request(app.getHttpServer())
    .post(`/workspaces/${workspaceId}/channels`)
    .set(authHeader(token))
    .send({ name: name ?? `channel-${Date.now()}`, isPrivate })
    .expect(201)

  return res.body as { id: string; name: string }
}
