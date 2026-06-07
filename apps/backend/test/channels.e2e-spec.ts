import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { createTestUser, authHeader } from './helpers/auth.helper'
import { createTestWorkspace, createTestChannel } from './helpers/seed.helper'

describe('Channels (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /workspaces/:wsId/channels', () => {
    it('ワークスペースオーナーがチャンネルを作成できる', async () => {
      const { token } = await createTestUser(app)
      const ws = await createTestWorkspace(app, token)

      const res = await request(app.getHttpServer())
        .post(`/workspaces/${ws.id}/channels`)
        .set(authHeader(token))
        .send({ name: 'new-channel' })
        .expect(201)

      expect(res.body.name).toBe('new-channel')
    })

    it('メンバー（非オーナー）はチャンネルを作成できない（403）', async () => {
      const { token: ownerToken } = await createTestUser(app)
      const { token: memberToken } = await createTestUser(app)
      const ws = await createTestWorkspace(app, ownerToken)

      await request(app.getHttpServer())
        .post('/workspaces/join')
        .set(authHeader(memberToken))
        .send({ inviteCode: ws.inviteCode })
        .expect(200)

      await request(app.getHttpServer())
        .post(`/workspaces/${ws.id}/channels`)
        .set(authHeader(memberToken))
        .send({ name: 'member-channel' })
        .expect(403)
    })
  })

  describe('DELETE /workspaces/:wsId/channels/:channelId', () => {
    it('通常チャンネルを削除できる', async () => {
      const { token } = await createTestUser(app)
      const ws = await createTestWorkspace(app, token)
      const ch = await createTestChannel(app, token, ws.id, 'to-delete')

      await request(app.getHttpServer())
        .delete(`/workspaces/${ws.id}/channels/${ch.id}`)
        .set(authHeader(token))
        .expect(204)
    })

    it('デフォルトチャンネル(general)の削除は403を返す', async () => {
      const { token } = await createTestUser(app)
      const ws = await createTestWorkspace(app, token)

      // generalチャンネルIDを取得
      const channelsRes = await request(app.getHttpServer())
        .get(`/workspaces/${ws.id}/channels`)
        .set(authHeader(token))
        .expect(200)

      const generalChannel = (channelsRes.body as { id: string; name: string }[]).find(
        (ch) => ch.name === 'general',
      )
      expect(generalChannel).toBeDefined()

      await request(app.getHttpServer())
        .delete(`/workspaces/${ws.id}/channels/${generalChannel!.id}`)
        .set(authHeader(token))
        .expect(403)
    })
  })

  describe('POST /workspaces/:wsId/channels/:channelId/join', () => {
    it('パブリックチャンネルに参加できる', async () => {
      const { token: ownerToken } = await createTestUser(app)
      const { token: memberToken } = await createTestUser(app)
      const ws = await createTestWorkspace(app, ownerToken)
      const ch = await createTestChannel(app, ownerToken, ws.id, 'public-ch')

      await request(app.getHttpServer())
        .post('/workspaces/join')
        .set(authHeader(memberToken))
        .send({ inviteCode: ws.inviteCode })
        .expect(200)

      await request(app.getHttpServer())
        .post(`/workspaces/${ws.id}/channels/${ch.id}/join`)
        .set(authHeader(memberToken))
        .expect(200)
    })

    it('プライベートチャンネルへの直接参加は403を返す', async () => {
      const { token: ownerToken } = await createTestUser(app)
      const { token: memberToken } = await createTestUser(app)
      const ws = await createTestWorkspace(app, ownerToken)
      const privateCh = await createTestChannel(app, ownerToken, ws.id, 'private-ch', true)

      await request(app.getHttpServer())
        .post('/workspaces/join')
        .set(authHeader(memberToken))
        .send({ inviteCode: ws.inviteCode })
        .expect(200)

      await request(app.getHttpServer())
        .post(`/workspaces/${ws.id}/channels/${privateCh.id}/join`)
        .set(authHeader(memberToken))
        .expect(403)
    })
  })
})
