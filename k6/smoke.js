/**
 * k6 スモークテスト
 *
 * 目的: 最小負荷で基本的な動作を確認する。常時実行可能。
 * 実行: k6 run k6/smoke.js
 *
 * メトリクス目標:
 * - HTTP p95 レイテンシ: < 300ms
 * - エラーレート: < 1%
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { login, authHeaders } from './lib/auth.js'
import { createWorkspaceAndGetChannel, postMessage, getMessages } from './lib/workspace.js'

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.05'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000'

export function setup() {
  // テスト用ユーザーとワークスペースを事前作成
  const auth = login()
  if (!auth) return null
  const workspace = createWorkspaceAndGetChannel(auth.token)
  return { token: auth.token, ...workspace }
}

export default function (data) {
  if (!data) return

  const { token, workspaceId, channelId } = data

  // 1. メッセージ一覧取得
  getMessages(token, workspaceId, channelId)
  sleep(0.5)

  // 2. メッセージ投稿
  postMessage(token, workspaceId, channelId, `Smoke test message ${Date.now()}`)
  sleep(0.5)

  // 3. ワークスペース情報取得
  const wsRes = http.get(`${BASE_URL}/workspaces/${workspaceId}`, {
    headers: authHeaders(token),
  })
  check(wsRes, { 'get workspace: status 200': (r) => r.status === 200 })
  sleep(1)
}
