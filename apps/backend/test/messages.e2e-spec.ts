import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { createTestUser, authHeader } from './helpers/auth.helper'
import { createTestWorkspace, createTestChannel } from './helpers/seed.helper'

describe('Messages (integration)', () => {
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

  async function setupWorkspaceWithChannel() {
    const { token: ownerToken, user: owner } = await createTestUser(app)
    const ws = await createTestWorkspace(app, ownerToken)
    // generalチャンネルを取得
    const channelsRes = await request(app.getHttpServer())
      .get(`/workspaces/${ws.id}/channels`)
      .set(authHeader(ownerToken))
    const general = (channelsRes.body as { id: string; name: string }[])[0]
    return { ownerToken, owner, ws, channel: general }
  }

  async function postMessage(
    token: string,
    wsId: string,
    channelId: string,
    content: string,
  ): Promise<{ id: string; content: string }> {
    const res = await request(app.getHttpServer())
      .post(`/workspaces/${wsId}/channels/${channelId}/messages`)
      .set(authHeader(token))
      .send({ content })
      .expect(201)
    return res.body as { id: string; content: string }
  }

  describe('POST /workspaces/:wsId/channels/:channelId/messages', () => {
    it('チャンネルメンバーがメッセージを投稿できる', async () => {
      const { ownerToken, ws, channel } = await setupWorkspaceWithChannel()

      const res = await request(app.getHttpServer())
        .post(`/workspaces/${ws.id}/channels/${channel.id}/messages`)
        .set(authHeader(ownerToken))
        .send({ content: 'Hello World' })
        .expect(201)

      expect(res.body.content).toBe('Hello World')
    })

    it('チャンネル非メンバーは投稿できない（403）', async () => {
      const { ownerToken, ws, channel } = await setupWorkspaceWithChannel()
      const { token: outsiderToken } = await createTestUser(app)

      await request(app.getHttpServer())
        .post('/workspaces/join')
        .set(authHeader(outsiderToken))
        .send({ inviteCode: ws.inviteCode })
        .expect(200)

      // ワークスペースメンバーだがチャンネル非メンバー（別チャンネルに招待されていない）
      // まず別チャンネルを作成してそこに参加しているがgeneralには参加していない状態はないので
      // generalチャンネルはinviteCode参加時に自動追加される。別チャンネルを作成してテスト。
      const privateCh = await createTestChannel(app, ownerToken, ws.id, 'private-msgs', true)

      await request(app.getHttpServer())
        .post(`/workspaces/${ws.id}/channels/${privateCh.id}/messages`)
        .set(authHeader(outsiderToken))
        .send({ content: 'should fail' })
        .expect(403)
    })
  })

  describe('PATCH /workspaces/:wsId/channels/:channelId/messages/:messageId', () => {
    it('著者は自分のメッセージを編集できる', async () => {
      const { ownerToken, ws, channel } = await setupWorkspaceWithChannel()
      const msg = await postMessage(ownerToken, ws.id, channel.id, 'Original')

      const res = await request(app.getHttpServer())
        .patch(`/workspaces/${ws.id}/channels/${channel.id}/messages/${msg.id}`)
        .set(authHeader(ownerToken))
        .send({ content: 'Edited' })
        .expect(200)

      expect(res.body.content).toBe('Edited')
    })

    it('第三者がメッセージを編集しようとすると403を返す', async () => {
      const { ownerToken, ws, channel } = await setupWorkspaceWithChannel()
      const { token: memberToken } = await createTestUser(app)

      await request(app.getHttpServer())
        .post('/workspaces/join')
        .set(authHeader(memberToken))
        .send({ inviteCode: ws.inviteCode })
        .expect(200)

      const msg = await postMessage(ownerToken, ws.id, channel.id, 'Owner message')

      await request(app.getHttpServer())
        .patch(`/workspaces/${ws.id}/channels/${channel.id}/messages/${msg.id}`)
        .set(authHeader(memberToken))
        .send({ content: 'Hacked' })
        .expect(403)
    })

    it('存在しないメッセージIDで404を返す', async () => {
      const { ownerToken, ws, channel } = await setupWorkspaceWithChannel()

      await request(app.getHttpServer())
        .patch(`/workspaces/${ws.id}/channels/${channel.id}/messages/non-existent-id`)
        .set(authHeader(ownerToken))
        .send({ content: 'Edit' })
        .expect(404)
    })

    it('別チャンネルのメッセージIDを指定した場合は404を返す（IDOR対策）', async () => {
      const { ownerToken, ws, channel } = await setupWorkspaceWithChannel()
      const otherCh = await createTestChannel(app, ownerToken, ws.id, 'other-ch')

      // otherChにメッセージを投稿
      const msgInOtherCh = await postMessage(ownerToken, ws.id, otherCh.id, 'Other channel msg')

      // generalチャンネルのURLでotherChのメッセージIDを指定（IDOR試行）
      await request(app.getHttpServer())
        .patch(`/workspaces/${ws.id}/channels/${channel.id}/messages/${msgInOtherCh.id}`)
        .set(authHeader(ownerToken))
        .send({ content: 'IDOR attempt' })
        .expect(404)
    })
  })

  describe('DELETE /workspaces/:wsId/channels/:channelId/messages/:messageId', () => {
    it('著者は自分のメッセージを削除できる', async () => {
      const { ownerToken, ws, channel } = await setupWorkspaceWithChannel()
      const msg = await postMessage(ownerToken, ws.id, channel.id, 'To delete')

      await request(app.getHttpServer())
        .delete(`/workspaces/${ws.id}/channels/${channel.id}/messages/${msg.id}`)
        .set(authHeader(ownerToken))
        .expect(204)
    })

    it('第三者がメッセージを削除しようとすると403を返す', async () => {
      const { ownerToken, ws, channel } = await setupWorkspaceWithChannel()
      const { token: memberToken } = await createTestUser(app)

      await request(app.getHttpServer())
        .post('/workspaces/join')
        .set(authHeader(memberToken))
        .send({ inviteCode: ws.inviteCode })
        .expect(200)

      const msg = await postMessage(ownerToken, ws.id, channel.id, 'Protected message')

      await request(app.getHttpServer())
        .delete(`/workspaces/${ws.id}/channels/${channel.id}/messages/${msg.id}`)
        .set(authHeader(memberToken))
        .expect(403)
    })
  })

  describe('GET /workspaces/:wsId/channels/:channelId/messages (カーソルページネーション)', () => {
    it('デフォルトで最新50件を返す', async () => {
      const { ownerToken, ws, channel } = await setupWorkspaceWithChannel()

      // 3件投稿
      for (let i = 0; i < 3; i++) {
        await postMessage(ownerToken, ws.id, channel.id, `Message ${i}`)
      }

      const res = await request(app.getHttpServer())
        .get(`/workspaces/${ws.id}/channels/${channel.id}/messages`)
        .set(authHeader(ownerToken))
        .expect(200)

      expect(Array.isArray(res.body.messages)).toBe(true)
      expect(res.body.messages.length).toBeGreaterThanOrEqual(3)
      expect(res.body).toHaveProperty('hasMore')
      expect(res.body).toHaveProperty('nextCursor')
    })
  })
})
