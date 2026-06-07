import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { createTestUser, authHeader } from './helpers/auth.helper'
import { createTestWorkspace } from './helpers/seed.helper'

describe('DM Rooms (integration)', () => {
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

  describe('POST /workspaces/:wsId/dm-rooms', () => {
    it('同じワークスペースのメンバーとDM部屋を作成できる', async () => {
      const { token: userAToken } = await createTestUser(app)
      const { token: userBToken, user: userB } = await createTestUser(app)
      const ws = await createTestWorkspace(app, userAToken)

      await request(app.getHttpServer())
        .post('/workspaces/join')
        .set(authHeader(userBToken))
        .send({ inviteCode: ws.inviteCode })
        .expect(200)

      const res = await request(app.getHttpServer())
        .post(`/workspaces/${ws.id}/dm-rooms`)
        .set(authHeader(userAToken))
        .send({ memberIds: [userB.id] })
        .expect(201)

      expect(res.body.id).toBeDefined()
    })

    it('ワークスペース非メンバーのユーザーはDM部屋を作成できない（WorkspaceMemberGuard）', async () => {
      const { token: userAToken } = await createTestUser(app)
      const { token: outsiderToken } = await createTestUser(app)
      const { user: userB } = await createTestUser(app)
      const ws = await createTestWorkspace(app, userAToken)

      // outsiderはwsに参加していない状態でDM作成を試みる
      await request(app.getHttpServer())
        .post(`/workspaces/${ws.id}/dm-rooms`)
        .set(authHeader(outsiderToken))
        .send({ memberIds: [userB.id] })
        .expect(403)
    })

    it('同じ相手と2回DM作成しても同じ部屋を返す（冪等性）', async () => {
      const { token: userAToken } = await createTestUser(app)
      const { token: userBToken, user: userB } = await createTestUser(app)
      const ws = await createTestWorkspace(app, userAToken)

      await request(app.getHttpServer())
        .post('/workspaces/join')
        .set(authHeader(userBToken))
        .send({ inviteCode: ws.inviteCode })
        .expect(200)

      const res1 = await request(app.getHttpServer())
        .post(`/workspaces/${ws.id}/dm-rooms`)
        .set(authHeader(userAToken))
        .send({ memberIds: [userB.id] })
        .expect(201)

      const res2 = await request(app.getHttpServer())
        .post(`/workspaces/${ws.id}/dm-rooms`)
        .set(authHeader(userAToken))
        .send({ memberIds: [userB.id] })
        .expect(201)

      expect(res1.body.id).toBe(res2.body.id)
    })
  })

  describe('GET /dm-rooms/:dmRoomId/messages (IDOR対策)', () => {
    it('DM部屋の非メンバーはメッセージを取得できない（403）', async () => {
      const { token: userAToken } = await createTestUser(app)
      const { token: userBToken, user: userB } = await createTestUser(app)
      const { token: outsiderToken } = await createTestUser(app)
      const ws = await createTestWorkspace(app, userAToken)

      await request(app.getHttpServer())
        .post('/workspaces/join')
        .set(authHeader(userBToken))
        .send({ inviteCode: ws.inviteCode })
        .expect(200)

      const dmRes = await request(app.getHttpServer())
        .post(`/workspaces/${ws.id}/dm-rooms`)
        .set(authHeader(userAToken))
        .send({ memberIds: [userB.id] })
        .expect(201)

      const dmRoomId = (dmRes.body as { id: string }).id

      // outsiderはDM部屋のメンバーではない
      await request(app.getHttpServer())
        .get(`/dm-rooms/${dmRoomId}/messages`)
        .set(authHeader(outsiderToken))
        .expect(403)
    })
  })
})
