import http from 'k6/http'
import { check } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000'

let userCounter = 0

/**
 * テスト用ユーザーを登録してJWTトークンを取得する。
 * 各VUが独立したユーザーとして動作するために使用する。
 */
export function login() {
  const username = `k6user_${Date.now()}_${++userCounter}_${Math.random().toString(36).slice(2, 8)}`
  const password = __ENV.TEST_PASSWORD || 'K6TestPass1!'

  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ username, displayName: `k6 User ${userCounter}`, password }),
    { headers: { 'Content-Type': 'application/json' } },
  )

  check(registerRes, {
    'register: status 201': (r) => r.status === 201,
  })

  if (registerRes.status !== 201) {
    return null
  }

  const body = JSON.parse(registerRes.body)
  return { token: body.token, userId: body.user.id, username }
}

/**
 * 既存ユーザーでログインしてトークンを取得する。
 * CI環境で事前にユーザーを作成している場合に使用する。
 */
export function loginExisting() {
  const username = __ENV.TEST_USERNAME || 'k6-test-user'
  const password = __ENV.TEST_PASSWORD || 'K6TestPass1!'

  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' } },
  )

  check(res, {
    'login: status 200': (r) => r.status === 200,
  })

  if (res.status !== 200) return null
  const body = JSON.parse(res.body)
  return { token: body.token, userId: body.user.id, username }
}

export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}
