import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { createTestUser, authHeader, uniqueUsername } from './helpers/auth.helper'
import { createTestWorkspace } from './helpers/seed.helper'

describe('Workspaces (integration)', () => {
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

  describe('POST /workspaces', () => {
    it('ワークスペースを作成して返す', async () => {
      const { token } = await createTestUser(app)

      const res = await request(app.getHttpServer())
        .post('/workspaces')
        .set(authHeader(token))
        .send({ name: 'My Workspace', description: 'Test workspace' })
        .expect(201)

      expect(res.body.id).toBeDefined()
      expect(res.body.name).toBe('My Workspace')
      expect(res.body.inviteCode).toBeDefined()
    })

    it('認証なしで401を返す', async () => {
      await request(app.getHttpServer()).post('/workspaces').send({ name: 'Test' }).expect(401)
    })
  })

  describe('GET /workspaces', () => {
    it('自分が参加しているワークスペース一覧を返す', async () => {
      const { token } = await createTestUser(app)
      await createTestWorkspace(app, token, 'WS List Test')

      const res = await request(app.getHttpServer())
        .get('/workspaces')
        .set(authHeader(token))
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('GET /workspaces/:wsId', () => {
    it('ワークスペースの詳細を返す', async () => {
      const { token } = await createTestUser(app)
      const ws = await createTestWorkspace(app, token)

      const res = await request(app.getHttpServer())
        .get(`/workspaces/${ws.id}`)
        .set(authHeader(token))
        .expect(200)

      expect(res.body.id).toBe(ws.id)
    })

    it('メンバーでないユーザーは403を返す', async () => {
      const { token: ownerToken } = await createTestUser(app)
      const { token: otherToken } = await createTestUser(app)
      const ws = await createTestWorkspace(app, ownerToken)

      await request(app.getHttpServer())
        .get(`/workspaces/${ws.id}`)
        .set(authHeader(otherToken))
        .expect(403)
    })
  })

  describe('POST /workspaces/join', () => {
    it('有効な招待コードでワークスペースに参加できる', async () => {
      const { token: ownerToken } = await createTestUser(app)
      const { token: joinerToken } = await createTestUser(app)
      const ws = await createTestWorkspace(app, ownerToken)

      const res = await request(app.getHttpServer())
        .post('/workspaces/join')
        .set(authHeader(joinerToken))
        .send({ inviteCode: ws.inviteCode })
        .expect(200)

      expect(res.body.id).toBe(ws.id)
    })

    it('無効な招待コードで404を返す', async () => {
      const { token } = await createTestUser(app)

      await request(app.getHttpServer())
        .post('/workspaces/join')
        .set(authHeader(token))
        .send({ inviteCode: 'invalid-code-xyz' })
        .expect(404)
    })
  })

  describe('GET /workspaces/:wsId/members', () => {
    it('ワークスペースのメンバー一覧を返す', async () => {
      const { token: ownerToken } = await createTestUser(app)
      const { token: joinerToken } = await createTestUser(app)
      const ws = await createTestWorkspace(app, ownerToken)

      await request(app.getHttpServer())
        .post('/workspaces/join')
        .set(authHeader(joinerToken))
        .send({ inviteCode: ws.inviteCode })
        .expect(200)

      const res = await request(app.getHttpServer())
        .get(`/workspaces/${ws.id}/members`)
        .set(authHeader(ownerToken))
        .expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(2)
    })
  })

  describe('招待コード再利用（既参加ユーザーのjoin冪等性）', () => {
    it('既に参加済みのユーザーが再度joinしても200を返す（upsert冪等性）', async () => {
      const { token: ownerToken } = await createTestUser(app)
      const { token: joinerToken } = await createTestUser(app)
      const ws = await createTestWorkspace(app, ownerToken)

      await request(app.getHttpServer())
        .post('/workspaces/join')
        .set(authHeader(joinerToken))
        .send({ inviteCode: ws.inviteCode })
        .expect(200)

      // 2回目の参加も200で冪等に処理される
      await request(app.getHttpServer())
        .post('/workspaces/join')
        .set(authHeader(joinerToken))
        .send({ inviteCode: ws.inviteCode })
        .expect(200)
    })
  })
})
