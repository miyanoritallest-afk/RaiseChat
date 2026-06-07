import http from 'k6/http'
import { check } from 'k6'
import { authHeaders } from './auth.js'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000'

/**
 * ワークスペースを作成して最初のチャンネル（general）IDを返す。
 * パフォーマンステストのセットアップとして各VUで実行する。
 */
export function createWorkspaceAndGetChannel(token) {
  const wsRes = http.post(
    `${BASE_URL}/workspaces`,
    JSON.stringify({ name: `k6-ws-${Date.now()}` }),
    { headers: authHeaders(token) },
  )

  check(wsRes, { 'create workspace: status 201': (r) => r.status === 201 })
  if (wsRes.status !== 201) return null

  const ws = JSON.parse(wsRes.body)

  // generalチャンネルを取得
  const chRes = http.get(`${BASE_URL}/workspaces/${ws.id}/channels`, {
    headers: authHeaders(token),
  })

  check(chRes, { 'get channels: status 200': (r) => r.status === 200 })
  if (chRes.status !== 200) return null

  const channels = JSON.parse(chRes.body)
  const general = channels[0]

  return { workspaceId: ws.id, channelId: general.id }
}

/**
 * チャンネルにメッセージを投稿する。
 */
export function postMessage(token, workspaceId, channelId, content) {
  const res = http.post(
    `${BASE_URL}/workspaces/${workspaceId}/channels/${channelId}/messages`,
    JSON.stringify({ content }),
    { headers: authHeaders(token) },
  )

  check(res, { 'post message: status 201': (r) => r.status === 201 })
  return res
}

/**
 * チャンネルのメッセージ一覧を取得する。
 */
export function getMessages(token, workspaceId, channelId) {
  const res = http.get(
    `${BASE_URL}/workspaces/${workspaceId}/channels/${channelId}/messages`,
    { headers: authHeaders(token) },
  )

  check(res, { 'get messages: status 200': (r) => r.status === 200 })
  return res
}
