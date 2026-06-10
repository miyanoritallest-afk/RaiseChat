# Socket.ioイベント仕様書

---

## 接続仕様

### エンドポイント

| 環境 | URL |
|---|---|
| 開発環境 | `ws://localhost:4000` |
| 本番環境 | `ws://raisechat-alb-1383858774.ap-northeast-1.elb.amazonaws.com` |

> Nginx が `/socket.io/*` を WebSocket upgrade して NestJS:4000 に転送する。ALB はスティッキーセッション有効。

### 認証

Socket.io接続時のhandshakeにJWTトークンを渡す。

```typescript
const socket = io('http://localhost:4000', {
  auth: {
    token: 'Bearer {jwtToken}'
  }
})
```

サーバー側でトークンを検証し、無効な場合は接続を拒否する（`handleConnection` で即 `disconnect(true)`）。

### 切断時の挙動

ユーザーが切断した際、サーバーは所属するワークスペースの全メンバーに `presence:updated` を配信してオフライン状態を通知する。

---

## ルーム設計

Socket.ioのルームをSlackのチャンネル・ワークスペースに対応させる。

| ルーム名 | 用途 |
|---|---|
| `workspace:{workspaceId}` | ワークスペース全体への通知・プレゼンス配信 |
| `channel:{channelId}` | チャンネル内のメッセージ・リアクション・ピン配信 |
| `dm:{dmRoomId}` | DM内のメッセージ配信 |
| `user:{userId}` | 通知など特定ユーザーへの個別配信 |

---

## イベント一覧

### 接続・ルーム管理

| 方向 | イベント名 | Payload | 概要 |
|---|---|---|---|
| Client → Server | `workspace:join` | `{ workspaceId: string }` | ワークスペースルームに参加 |
| Client → Server | `workspace:leave` | `{ workspaceId: string }` | ワークスペースルームから退出 |
| Client → Server | `channel:join` | `{ channelId: string }` | チャンネルルームに参加（メンバー確認あり） |
| Client → Server | `channel:leave` | `{ channelId: string }` | チャンネルルームから退出 |
| Client → Server | `dm:join` | `{ dmRoomId: string }` | DMルームに参加（メンバー確認あり） |
| Client → Server | `dm:leave` | `{ dmRoomId: string }` | DMルームから退出 |

---

### チャンネルメッセージ

#### message:send（Client → Server）

```typescript
{
  channelId: string
  content: string
  threadId?: string        // スレッド返信の場合は親メッセージID
  attachments?: Array<{
    s3Key: string
    fileType: string
    fileName: string
    fileSize: number
  }>
}
```

#### message:update（Client → Server）

```typescript
{ messageId: string; channelId: string; content: string }
```

#### message:delete（Client → Server）

```typescript
{ messageId: string; channelId: string }
```

#### message:received（Server → Client）

- 配信先: `channel:{channelId}` ルーム全員
- 新着メッセージオブジェクト（添付ファイルの署名付きURL変換済み）

```typescript
{
  id: string; content: string; createdAt: string; updatedAt: string
  deletedAt: null; threadId: string | null
  user: { id: string; displayName: string; avatarUrl: string | null }
  attachments: Array<{ fileUrl: string; fileType: string; fileName: string; fileSize: number }>
  reactions: Array<{ emoji: string; count: number; userIds: string[] }>
  _count: { replies: number }
  replies: Array<{ user: { id: string; displayName: string; avatarUrl: string | null } }>
}
```

#### message:updated（Server → Client）

- 配信先: `channel:{channelId}` ルーム全員
- 更新後のメッセージオブジェクト（message:received と同形状）

#### message:deleted（Server → Client）

- 配信先: `channel:{channelId}` ルーム全員

```typescript
{ messageId: string; channelId: string }
```

---

### スレッド

#### thread:send（Client → Server）

`message:send` の `threadId` フィールドでスレッド返信を送る（専用イベントなし）。

#### thread:reply_count_updated（Server → Client）

- 配信先: `channel:{channelId}` ルーム全員
- スレッド返信が追加・更新・削除された際に親メッセージの返信数を更新

```typescript
{
  messageId: string
  replyCount: number
  latestRepliers: Array<{ id: string; displayName: string; avatarUrl: string | null }>
}
```

---

### DM

#### dm:send（Client → Server）

```typescript
{
  dmRoomId: string
  content: string
  attachments?: Array<{ s3Key: string; fileType: string; fileName: string; fileSize: number }>
}
```

#### dm:update（Client → Server）

```typescript
{ dmRoomId: string; messageId: string; content: string }
```

#### dm:delete（Client → Server）

```typescript
{ dmRoomId: string; messageId: string }
```

#### dm:received（Server → Client）

- 配信先: `dm:{dmRoomId}` ルーム全員

```typescript
{
  id: string; content: string; createdAt: string; updatedAt: string; deletedAt: null
  user: { id: string; displayName: string; avatarUrl: string | null }
  attachments: Array<{ fileUrl: string; fileType: string; fileName: string; fileSize: number }>
}
```

#### dm:updated（Server → Client）

- 配信先: `dm:{dmRoomId}` ルーム全員
- 更新後のDMメッセージオブジェクト（dm:received と同形状）

#### dm:deleted（Server → Client）

- 配信先: `dm:{dmRoomId}` ルーム全員

```typescript
{ dmRoomId: string; messageId: string }
```

---

### リアクション

#### reaction:toggle（Client → Server）

`POST /workspaces/:wsId/channels/:channelId/messages/:messageId/reactions` のREST API経由で実施。Socket.ioでの直接送信はなし。

#### reaction:updated（Server → Client）

- 配信先: `channel:{channelId}` ルーム全員
- トグル後の全リアクション最新状態

```typescript
{
  messageId: string
  reactions: Array<{ emoji: string; count: number; userIds: string[] }>
}
```

---

### ピン留め

#### pin:add / pin:remove（Client → Server）

REST API（`POST/DELETE /pins`）経由で実施。Socket.ioでの直接送信はなし。

#### pin:updated（Server → Client）

- 配信先: `channel:{channelId}` ルーム全員

```typescript
{ channelId: string; action: 'added' | 'removed'; pin: PinObject }
```

---

### タイピングインジケーター

#### typing:start（Client → Server）

```typescript
{ channelId: string }
```

#### typing:stop（Client → Server）

```typescript
{ channelId: string }
```

#### typing:update（Server → Client）

- 配信先: `channel:{channelId}` ルーム全員（送信者を除く）
- DBアクセスなし・低レイテンシでリアルタイム転送

```typescript
{ channelId: string; typingUsers: Array<{ userId: string; displayName: string }> }
```

---

### オンライン状態

#### presence:updated（Server → Client）

- 配信先: `workspace:{workspaceId}` ルーム全員
- タイミング: ユーザーの接続・切断時、ステータス変更時

```typescript
{ userId: string; status: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'DND' }
```

---

### 通知

#### notification:received（Server → Client）

- 配信先: `user:{userId}` ルーム（通知対象のユーザーのみ）
- タイミング: メンション・スレッド返信・DM受信時

```typescript
{
  id: string; type: 'MENTION' | 'THREAD_REPLY' | 'DM_UNREAD'; isRead: false
  createdAt: string
  message?: { id: string; content: string; channel: { id: string; name: string } }
  actor: { id: string; displayName: string; avatarUrl: string | null }
}
```
