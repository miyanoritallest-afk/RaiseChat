/**
 * k6 ロードテスト
 *
 * 目的: 定常負荷（50VU）→ スパイク（200VU）での動作を検証する。
 * Slack相当の業務用途（数十〜数百人同時利用）を想定。
 * 実行: k6 run k6/load.js
 *
 * メトリクス目標:
 * - HTTP p95 レイテンシ: < 300ms
 * - HTTP p99 レイテンシ: < 1000ms
 * - エラーレート: < 1%
 * - スループット: > 100 req/s (定常時)
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { login, authHeaders } from './lib/auth.js'
import { createWorkspaceAndGetChannel, postMessage, getMessages } from './lib/workspace.js'

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // ランプアップ: 0 → 50 VU
    { duration: '5m', target: 50 },   // 定常: 50 VU
    { duration: '1m', target: 200 },  // スパイク: → 200 VU
    { duration: '2m', target: 0 },    // クールダウン: 200 → 0 VU
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000'

// 各VUで使い回す認証情報（initで1度だけ作成）
let sessionToken = null
let sessionWorkspaceId = null
let sessionChannelId = null

export function setup() {
  // 共有ワークスペースを1つ作成してすべてのVUで使い回す
  const auth = login()
  if (!auth) return null
  const workspace = createWorkspaceAndGetChannel(auth.token)
  if (!workspace) return null
  return {
    ownerToken: auth.token,
    workspaceId: workspace.workspaceId,
    channelId: workspace.channelId,
    inviteCode: null, // setupで取得する場合
  }
}

export default function (data) {
  if (!data) return

  // 各VUで個別のユーザーを作成（初回のみ）
  if (!sessionToken) {
    const auth = login()
    if (!auth) return
    sessionToken = auth.token
    sessionWorkspaceId = data.workspaceId
    sessionChannelId = data.channelId
  }

  const token = sessionToken
  const workspaceId = sessionWorkspaceId
  const channelId = sessionChannelId

  // シナリオ: チャット業務の典型的な操作パターン
  // 1. メッセージ一覧を取得（読み取り主体のワークロード）
  const readRes = getMessages(token, workspaceId, channelId)
  check(readRes, { 'read messages ok': (r) => r.status === 200 })
  sleep(Math.random() * 2 + 1) // 1〜3秒の読み取りタイム

  // 2. メッセージを投稿（書き込みは読み取りの約1/5）
  if (Math.random() < 0.2) {
    const writeRes = postMessage(token, workspaceId, channelId, `Load test msg ${Date.now()}`)
    check(writeRes, { 'write message ok': (r) => r.status === 201 })
  }

  sleep(Math.random() * 3 + 2) // 2〜5秒の操作間隔
}

export function teardown(data) {
  // ロードテスト後のクリーンアップ（必要に応じて）
}
