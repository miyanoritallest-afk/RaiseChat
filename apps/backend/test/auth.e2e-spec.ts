import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { createTestUser, authHeader, uniqueUsername } from './helpers/auth.helper'
import { cleanDatabase } from './helpers/db.helper'

describe('Auth (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    await cleanDatabase()

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

  describe('POST /auth/register', () => {
    it('新規ユーザーを登録してtokenとuserを返す', async () => {
      const username = uniqueUsername('reg')
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username, displayName: 'Reg User', password: 'TestPass1!' })
        .expect(201)

      expect(res.body.token).toBeDefined()
      expect(res.body.user.username).toBe(username)
    })

    it('レスポンスにpasswordHashが含まれない（セキュリティ必須チェック）', async () => {
      const username = uniqueUsername('secure')
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username, displayName: 'Secure User', password: 'TestPass1!' })
        .expect(201)

      expect(res.body.user.passwordHash).toBeUndefined()
      expect(JSON.stringify(res.body)).not.toContain('passwordHash')
    })

    it('重複usernameで409 Conflictを返す', async () => {
      const username = uniqueUsername('dup')
      await createTestUser(app, username)

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username, displayName: 'Dup User', password: 'TestPass1!' })
        .expect(409)
    })

    it('バリデーションエラー: usernameなしで400を返す', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ displayName: 'No Username', password: 'TestPass1!' })
        .expect(400)
    })
  })

  describe('POST /auth/login', () => {
    it('正しい認証情報でtokenとuserを返す', async () => {
      const username = uniqueUsername('login')
      await createTestUser(app, username)

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username, password: 'TestPass1!' })
        .expect(200)

      expect(res.body.token).toBeDefined()
    })

    it('存在しないusernameで401を返す（ユーザー列挙攻撃対策）', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'non-existent-user-xyz', password: 'any' })
        .expect(401)

      expect(res.body.message).toBeDefined()
    })

    it('パスワード不一致で401を返す（ユーザー列挙攻撃対策）', async () => {
      const username = uniqueUsername('wrongpw')
      await createTestUser(app, username)

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username, password: 'WrongPassword!' })
        .expect(401)

      expect(res.body.message).toBeDefined()
    })

    it('ユーザー不存在とパスワード不一致で同一のエラーメッセージ（ユーザー列挙攻撃対策）', async () => {
      const username = uniqueUsername('enumtest')
      await createTestUser(app, username)

      const resUnknown = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'totally-unknown-user-abc', password: 'any' })
        .expect(401)

      const resWrongPw = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username, password: 'WrongPassword!' })
        .expect(401)

      expect(resUnknown.body.message).toBe(resWrongPw.body.message)
    })
  })

  describe('GET /auth/me', () => {
    it('有効なJWTで認証済みユーザー情報を返す', async () => {
      const { token, user } = await createTestUser(app)

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set(authHeader(token))
        .expect(200)

      expect(res.body.id).toBe(user.id)
      expect(res.body.username).toBe(user.username)
    })

    it('JWTなしで401を返す', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401)
    })

    it('無効なJWTで401を返す', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set({ Authorization: 'Bearer invalid-token' })
        .expect(401)
    })
  })
})
