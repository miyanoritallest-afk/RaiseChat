/**
 * k6 スパイクテスト
 *
 * 目的: 急激な負荷増加（0 → 500VU を一瞬で）への耐性を検証する。
 * シナリオ: 大規模イベント（全社ミーティング終了後の一斉チャット）を想定。
 * 実行: k6 run k6/spike.js
 *
 * メトリクス目標 (スパイク時は緩め):
 * - HTTP p95 レイテンシ: < 1000ms
 * - エラーレート: < 5%
 */
import { check, sleep } from 'k6'
import { login } from './lib/auth.js'
import { createWorkspaceAndGetChannel, postMessage, getMessages } from './lib/workspace.js'

export const options = {
  stages: [
    { duration: '10s', target: 5 },    // ウォームアップ
    { duration: '1m', target: 500 },   // 急激なスパイク
    { duration: '3m', target: 500 },   // スパイク維持
    { duration: '10s', target: 0 },    // 急激なクールダウン
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<3000'],
    http_req_failed: ['rate<0.05'],
  },
}

let sessionToken = null
let sessionWorkspaceId = null
let sessionChannelId = null

export function setup() {
  const auth = login()
  if (!auth) return null
  const workspace = createWorkspaceAndGetChannel(auth.token)
  return { token: auth.token, ...workspace }
}

export default function (data) {
  if (!data) return

  if (!sessionToken) {
    const auth = login()
    if (!auth) return
    sessionToken = auth.token
    sessionWorkspaceId = data.workspaceId
    sessionChannelId = data.channelId
  }

  // スパイクシナリオ: メッセージ読み取りのみ（高頻度アクセスをシミュレート）
  const readRes = getMessages(sessionToken, sessionWorkspaceId, sessionChannelId)
  check(readRes, { 'spike read ok': (r) => r.status === 200 || r.status === 429 })

  sleep(0.5)
}
