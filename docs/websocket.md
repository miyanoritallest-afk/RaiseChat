# Socket.ioイベント仕様書

> このドキュメントはフェーズ2（リアルタイム通信）開始前に仕様を固め、実装と並走して更新する。

---

## 接続仕様

### エンドポイント

| 環境 | URL |
|---|---|
| 開発環境 | `ws://localhost:4000` |
| 本番環境 | `wss://（Render URLを記載予定）` |

### 認証

Socket.io接続時のhandshakeにJWTトークンを渡す。

```typescript
const socket = io('http://localhost:4000', {
  auth: {
    token: 'Bearer {jwtToken}'
  }
})
```

サーバー側でトークンを検証し、無効な場合は接続を拒否する。

### 切断時の挙動

ユーザーが切断した際、サーバーは所属するワークスペースの全メンバーに `presence:updated` を配信してオフライン状態を通知する。

---

## ルーム設計

Socket.ioのルームをSlackのチャンネル・ワークスペースに対応させる。

| ルーム名 | 用途 |
|---|---|
| `workspace:{workspaceId}` | ワークスペース全体への通知配信 |
| `channel:{channelId}` | チャンネル内のメッセージ配信 |
| `dm:{dmRoomId}` | DM内のメッセージ配信 |

---

## イベント一覧

### 接続・ルーム管理

| 方向 | イベント名 | Payload | 概要 |
|---|---|---|---|
| Client → Server | workspace:join | `{ workspaceId: string }` | ワークスペースに接続 |
| Client → Server | workspace:leave | `{ workspaceId: string }` | ワークスペースから切断 |
| Client → Server | channel:join | `{ channelId: string }` | チャンネルに接続 |
| Client → Server | channel:leave | `{ channelId: string }` | チャンネルから切断 |
| Client → Server | dm:join | `{ dmRoomId: string }` | DMルームに接続 |
| Client → Server | dm:leave | `{ dmRoomId: string }` | DMルームから切断 |

---

### メッセージ

#### message:send（Client → Server）

> 未実装

#### message:edit（Client → Server）

> 未実装

#### message:delete（Client → Server）

> 未実装

#### message:received（Server → Client）

> 未実装
- 配信先：`channel:{channelId}` ルーム全員

#### message:updated（Server → Client）

> 未実装
- 配信先：`channel:{channelId}` ルーム全員

#### message:deleted（Server → Client）

> 未実装
- 配信先：`channel:{channelId}` ルーム全員

---

### スレッド

#### thread:send（Client → Server）

> 未実装

#### thread:received（Server → Client）

> 未実装
- 配信先：`channel:{channelId}` ルーム全員

---

### DM

#### dm:send（Client → Server）

> 未実装

#### dm:edit（Client → Server）

> 未実装

#### dm:delete（Client → Server）

> 未実装

#### dm:received（Server → Client）

> 未実装
- 配信先：`dm:{dmRoomId}` ルーム全員

#### dm:updated（Server → Client）

> 未実装
- 配信先：`dm:{dmRoomId}` ルーム全員

#### dm:deleted（Server → Client）

> 未実装
- 配信先：`dm:{dmRoomId}` ルーム全員

---

### リアクション

#### reaction:add（Client → Server）

> 未実装

#### reaction:remove（Client → Server）

> 未実装

#### reaction:updated（Server → Client）

> 未実装
- 配信先：`channel:{channelId}` ルーム全員

---

### タイピングインジケーター

#### typing:start（Client → Server）

> 未実装

#### typing:stop（Client → Server）

> 未実装

#### typing:updated（Server → Client）

> 未実装
- 配信先：`channel:{channelId}` ルーム全員（送信者を除く）

---

### オンライン状態

#### presence:updated（Server → Client）

> 未実装
- 配信先：`workspace:{workspaceId}` ルーム全員
- タイミング：ユーザーの接続・切断時

---

### 通知

#### notification:received（Server → Client）

> 未実装
- 配信先：通知対象のユーザーのみ
