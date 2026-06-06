# API仕様書

> このドキュメントはフェーズ1（認証機能）完了後から実装と並走して追記する。

---

## 共通仕様

### ベースURL

| 環境 | URL |
|---|---|
| 開発環境 | `http://localhost:4000` |
| 本番環境 | `https://（Render URLを記載予定）` |

### 認証

認証が必要なエンドポイントは `Authorization` ヘッダーにJWTトークンを付与する。

```
Authorization: Bearer {token}
```

### エラーレスポンス

```json
{
  "statusCode": 400,
  "message": "エラー内容",
  "error": "Bad Request"
}
```

| ステータスコード | 意味 |
|---|---|
| 400 | Bad Request（バリデーションエラー） |
| 401 | Unauthorized（認証エラー） |
| 403 | Forbidden（権限エラー） |
| 404 | Not Found |
| 409 | Conflict（重複エラー） |
| 422 | Unprocessable Entity（ファイル形式不正） |

### ページネーション（カーソルベース）

```
GET /workspaces/:wsId/channels/:channelId/messages?cursor={messageId}&limit=50
```

| パラメータ | 必須 | 概要 |
|---|---|---|
| cursor | 任意 | 最後に取得したメッセージID。省略時は最新件を取得 |
| limit | 任意 | 取得件数（デフォルト：50） |

---

## 認証

### POST /auth/register

新規ユーザーを登録してJWTトークンを返す。

**Request Body**

```json
{
  "username": "john_doe",
  "displayName": "John Doe",
  "password": "password123"
}
```

| フィールド | 型 | バリデーション |
|---|---|---|
| username | string | 3〜20文字、英数字・アンダースコアのみ |
| displayName | string | 1〜50文字 |
| password | string | 8文字以上 |

**Response 201**

```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "cuid...",
    "username": "john_doe",
    "displayName": "John Doe",
    "avatarUrl": null,
    "status": "OFFLINE"
  }
}
```

**Errors**
- `400` バリデーションエラー
- `409` ユーザー名が既に使用されている

---

### POST /auth/login

**Request Body**

```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Response 200**

```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "cuid...",
    "username": "john_doe",
    "displayName": "John Doe",
    "avatarUrl": null,
    "status": "OFFLINE"
  }
}
```

**Errors**
- `401` ユーザー名またはパスワードが正しくない（存在確認とパスワード不一致を区別しない）

---

### POST /auth/logout

認証済みユーザーのログアウト。JWTはステートレスのためサーバー側での処理なし。クライアント側でトークンを削除する。

**Headers** `Authorization: Bearer {token}` 必須

**Response 200**

```json
{ "message": "ログアウトしました" }
```

---

### GET /auth/me

現在の認証済みユーザー情報を返す。トークンのペイロードを直接返さずDBから最新情報を取得する。

**Headers** `Authorization: Bearer {token}` 必須

**Response 200**

```json
{
  "id": "cuid...",
  "username": "john_doe",
  "displayName": "John Doe",
  "avatarUrl": null,
  "status": "OFFLINE",
  "statusMessage": null,
  "createdAt": "2026-06-05T00:00:00.000Z",
  "updatedAt": "2026-06-05T00:00:00.000Z"
}
```

---

## ユーザー

### PATCH /users/me

プロフィール情報（表示名・アバターURL・ステータス）を更新する。

**Headers** `Authorization: Bearer {token}` 必須

**Request Body**（すべて任意）

```json
{
  "displayName": "New Name",
  "avatarUrl": "https://example.com/avatar.png",
  "status": "ONLINE",
  "statusMessage": "作業中"
}
```

**Response 200** — 更新後のユーザーオブジェクト（GET /auth/me と同じ形状）

---

## ワークスペース

### GET /workspaces

自分が参加しているワークスペース一覧を返す。

**Headers** `Authorization: Bearer {token}` 必須

**Response 200**

```json
[
  {
    "id": "cuid...",
    "name": "RaiseChat",
    "description": "開発チームのWS",
    "iconUrl": null,
    "inviteCode": "abc123",
    "createdAt": "2026-06-05T00:00:00.000Z"
  }
]
```

---

### POST /workspaces

新規ワークスペースを作成する。作成者はオーナーになる。`#general` チャンネルが自動作成される。

**Headers** `Authorization: Bearer {token}` 必須

**Request Body**

```json
{
  "name": "RaiseChat",
  "description": "開発チームのWS",
  "iconUrl": null
}
```

| フィールド | 型 | バリデーション |
|---|---|---|
| name | string | 1〜50文字 |
| description | string | 任意、最大200文字 |
| iconUrl | string | 任意 |

**Response 201** — 作成したワークスペースオブジェクト

---

### GET /workspaces/:wsId

ワークスペースの詳細情報を返す。

**Headers** `Authorization: Bearer {token}` 必須（ワークスペースメンバーのみ）

**Response 200** — ワークスペースオブジェクト（メンバー一覧含む）

---

### PATCH /workspaces/:wsId

ワークスペース情報を更新する。オーナーのみ。

**Headers** `Authorization: Bearer {token}` 必須

**Request Body**（すべて任意）

```json
{ "name": "New Name", "description": "新しい説明", "iconUrl": null }
```

**Response 200** — 更新後のワークスペースオブジェクト

---

### GET /workspaces/:wsId/members

ワークスペースメンバー一覧を返す。

**Headers** `Authorization: Bearer {token}` 必須（ワークスペースメンバーのみ）

**Response 200**

```json
[
  {
    "userId": "cuid...",
    "role": "OWNER",
    "user": { "id": "cuid...", "displayName": "John Doe", "avatarUrl": null, "status": "ONLINE" }
  }
]
```

---

### POST /workspaces/:wsId/members/invite

招待コードを再生成する。オーナーのみ。

**Headers** `Authorization: Bearer {token}` 必須

**Response 200**

```json
{ "inviteCode": "newcode123" }
```

---

### DELETE /workspaces/:wsId/members/:userId

メンバーをキックする。オーナーのみ。オーナー自身は削除不可。

**Headers** `Authorization: Bearer {token}` 必須

**Response 200**

```json
{ "message": "メンバーを削除しました" }
```

---

### POST /workspaces/join

招待コードでワークスペースに参加する。`#general` チャンネルに自動参加する。

**Headers** `Authorization: Bearer {token}` 必須

**Request Body**

```json
{ "inviteCode": "abc123" }
```

**Response 200** — 参加したワークスペースオブジェクト

**Errors**
- `404` 招待コードが存在しない

---

## チャンネル

### GET /workspaces/:wsId/channels

アクセス可能なチャンネル一覧を返す（パブリック全件 + 参加中のプライベートチャンネル）。

**Headers** `Authorization: Bearer {token}` 必須（ワークスペースメンバーのみ）

**Response 200**

```json
[
  {
    "id": "cuid...",
    "name": "general",
    "description": null,
    "isPrivate": false,
    "isDefault": true,
    "memberCount": 5,
    "isMember": true
  }
]
```

---

### POST /workspaces/:wsId/channels

チャンネルを作成する。オーナーのみ。

**Headers** `Authorization: Bearer {token}` 必須

**Request Body**

```json
{
  "name": "dev-backend",
  "description": "バックエンド開発チャンネル",
  "isPrivate": false
}
```

| フィールド | 型 | バリデーション |
|---|---|---|
| name | string | 1〜50文字、`/^[a-z0-9_-]+$/` |
| description | string | 任意、最大200文字 |
| isPrivate | boolean | デフォルト false |

**Response 201** — 作成したチャンネルオブジェクト

---

### GET /workspaces/:wsId/channels/:channelId

チャンネル詳細を返す。

**Headers** `Authorization: Bearer {token}` 必須（チャンネルメンバーのみ）

**Response 200** — チャンネルオブジェクト

---

### PATCH /workspaces/:wsId/channels/:channelId

チャンネル情報を更新する。オーナーのみ。

**Request Body**（すべて任意）

```json
{ "name": "new-name", "description": "新しい説明" }
```

**Response 200** — 更新後のチャンネルオブジェクト

---

### DELETE /workspaces/:wsId/channels/:channelId

チャンネルを削除する。オーナーのみ。`isDefault: true` のチャンネルは削除不可（403）。

**Response 200**

```json
{ "message": "チャンネルを削除しました" }
```

---

### POST /workspaces/:wsId/channels/:channelId/join

チャンネルに参加する。パブリックチャンネルのみ。

**Headers** `Authorization: Bearer {token}` 必須（ワークスペースメンバーのみ）

**Response 200**

```json
{ "message": "チャンネルに参加しました" }
```

---

### DELETE /workspaces/:wsId/channels/:channelId/leave

チャンネルから退出する。

**Response 200**

```json
{ "message": "チャンネルを退出しました" }
```

---

## メッセージ

### GET /workspaces/:wsId/channels/:channelId/messages

チャンネルのメッセージ一覧を返す（カーソルベースページネーション）。スレッド返信（`threadId` あり）は含まない。

**Headers** `Authorization: Bearer {token}` 必須（チャンネルメンバーのみ）

**Query Parameters**

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| cursor | 任意 | - | 最後に取得したメッセージID |
| limit | 任意 | 50 | 取得件数（最大100） |

**Response 200**

```json
{
  "messages": [
    {
      "id": "cuid...",
      "content": "こんにちは",
      "createdAt": "2026-06-05T00:00:00.000Z",
      "updatedAt": "2026-06-05T00:00:00.000Z",
      "deletedAt": null,
      "threadId": null,
      "user": { "id": "cuid...", "displayName": "John", "avatarUrl": null },
      "attachments": [],
      "reactions": [{ "emoji": "👍", "count": 2, "userIds": ["uid1", "uid2"], "hasMe": false }],
      "_count": { "replies": 3 },
      "replies": [
        { "user": { "id": "cuid...", "displayName": "Jane", "avatarUrl": null } }
      ]
    }
  ],
  "nextCursor": "cuid...",
  "hasMore": true
}
```

---

### GET /workspaces/:wsId/channels/:channelId/messages/:messageId/replies

スレッド返信一覧を返す。

**Headers** `Authorization: Bearer {token}` 必須（チャンネルメンバーのみ）

**Response 200**

```json
{
  "parentMessage": { "id": "cuid...", "content": "親メッセージ", "user": { ... } },
  "replies": [ ... ],
  "nextCursor": null,
  "hasMore": false
}
```

---

### PATCH /workspaces/:wsId/channels/:channelId/messages/:messageId

メッセージを編集する。投稿者本人またはワークスペースオーナーのみ。

**Request Body**

```json
{ "content": "編集後の内容" }
```

**Response 200** — 更新後のメッセージオブジェクト

---

### DELETE /workspaces/:wsId/channels/:channelId/messages/:messageId

メッセージをソフトデリートする（`deletedAt` を設定）。投稿者本人またはワークスペースオーナーのみ。

**Response 200**

```json
{ "message": "メッセージを削除しました" }
```

---

## リアクション

### POST /workspaces/:wsId/channels/:channelId/messages/:messageId/reactions

絵文字リアクションをトグルする（追加済みなら削除、未追加なら追加）。

**Headers** `Authorization: Bearer {token}` 必須（チャンネルメンバーのみ）

**Request Body**

```json
{ "emoji": "👍" }
```

| フィールド | 型 | バリデーション |
|---|---|---|
| emoji | string | 1〜10文字 |

**Response 200**

```json
{
  "action": "added",
  "reactions": [
    { "emoji": "👍", "count": 3, "userIds": ["uid1", "uid2", "uid3"], "hasMe": true }
  ]
}
```

**Errors**
- `404` メッセージが指定チャンネルに存在しない（IDOR対策）

---

## ピン留め

### GET /workspaces/:wsId/channels/:channelId/pins

チャンネルのピン一覧を返す。

**Headers** `Authorization: Bearer {token}` 必須（チャンネルメンバーのみ）

**Response 200**

```json
[
  {
    "id": "cuid...",
    "messageId": "cuid...",
    "channelId": "cuid...",
    "createdAt": "2026-06-06T00:00:00.000Z",
    "user": { "id": "cuid...", "displayName": "John", "avatarUrl": null },
    "message": {
      "id": "cuid...",
      "content": "重要な情報",
      "createdAt": "2026-06-06T00:00:00.000Z",
      "user": { "id": "cuid...", "displayName": "John", "avatarUrl": null }
    }
  }
]
```

---

### POST /workspaces/:wsId/channels/:channelId/pins

メッセージをピン留めする。チャンネルメンバー全員可。

**Headers** `Authorization: Bearer {token}` 必須（チャンネルメンバーのみ）

**Request Body**

```json
{ "messageId": "cuid..." }
```

**Response 201** — 作成したピンオブジェクト

**Errors**
- `404` メッセージが指定チャンネルに存在しない（IDOR対策）
- `409` 既にピン済み

---

### DELETE /workspaces/:wsId/channels/:channelId/pins/:messageId

ピン留めを解除する。ピン追加者またはワークスペースオーナーのみ。

**Response 200**

```json
{ "message": "ピンを解除しました" }
```

**Errors**
- `403` 権限なし（追加者でもオーナーでもない）
- `404` ピンが存在しない、またはIDOR違反

---

## ファイルアップロード

### POST /workspaces/:wsId/uploads

ファイルをS3にアップロードし、S3キーを返す。返却された `s3Key` を `message:send` の `attachments` に含めてメッセージを送信する。

**Headers**
- `Authorization: Bearer {token}` 必須（ワークスペースメンバーのみ）
- `Content-Type: multipart/form-data`

**Form Data**

| フィールド | 説明 |
|---|---|
| file | アップロードするファイル |

**許可MIMEタイプ** / **サイズ上限**

| 種別 | MIMEタイプ | 上限 |
|---|---|---|
| 画像 | `image/jpeg`, `image/png`, `image/gif`, `image/webp` | 10MB |
| 動画 | `video/mp4`, `video/webm` | 100MB |

**Response 201**

```json
{
  "s3Key": "workspace-id/550e8400-e29b-41d4-a716-446655440000.jpg",
  "fileType": "image/jpeg",
  "fileName": "photo.jpg",
  "fileSize": 204800
}
```

**Errors**
- `400` ファイルが添付されていない
- `413` ファイルサイズ超過
- `422` 許可されていないファイル形式、またはマジックバイト検証失敗

---

## DM（ダイレクトメッセージ）

### GET /workspaces/:wsId/dm-rooms

自分が参加しているDMルーム一覧を返す。

**Headers** `Authorization: Bearer {token}` 必須

**Response 200**

```json
[
  {
    "id": "cuid...",
    "name": null,
    "members": [
      { "userId": "cuid...", "user": { "id": "cuid...", "displayName": "Jane", "avatarUrl": null, "status": "ONLINE" } }
    ]
  }
]
```

---

### POST /workspaces/:wsId/dm-rooms

DMルームを作成または既存ルームを返す（1対1 DM の重複防止）。

**Headers** `Authorization: Bearer {token}` 必須（ワークスペースメンバーのみ）

**Request Body**

```json
{ "targetUserId": "cuid..." }
```

**Response 201 / 200** — DMルームオブジェクト

---

### GET /workspaces/:wsId/dm-rooms/:roomId/messages

DMルームのメッセージ一覧を返す（カーソルベースページネーション）。

**Headers** `Authorization: Bearer {token}` 必須（DM ルームメンバーのみ）

**Query Parameters** — `cursor`, `limit`（メッセージ一覧と同じ）

**Response 200**

```json
{
  "messages": [
    {
      "id": "cuid...",
      "content": "こんにちは",
      "createdAt": "2026-06-06T00:00:00.000Z",
      "user": { "id": "cuid...", "displayName": "John", "avatarUrl": null },
      "attachments": []
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

---

### PATCH /workspaces/:wsId/dm-rooms/:roomId/messages/:messageId

DMメッセージを編集する。投稿者本人のみ。

**Request Body**

```json
{ "content": "編集後の内容" }
```

**Response 200** — 更新後のメッセージオブジェクト

---

### DELETE /workspaces/:wsId/dm-rooms/:roomId/messages/:messageId

DMメッセージをソフトデリートする。投稿者本人のみ。

**Response 200**

```json
{ "message": "メッセージを削除しました" }
```

---

## メッセージ検索

### GET /workspaces/:wsId/search

ワークスペース内のメッセージを全文検索する。アクセス可能なチャンネル（パブリック全件 + 参加中のプライベート）のみが対象。

**Headers** `Authorization: Bearer {token}` 必須（ワークスペースメンバーのみ）

**Query Parameters**

| パラメータ | 必須 | バリデーション | 説明 |
|---|---|---|---|
| q | 必須 | 2〜100文字 | 検索キーワード（大文字小文字区別なし） |
| cursor | 任意 | - | カーソルID |
| limit | 任意 | 1〜50、デフォルト20 | 取得件数 |

**Response 200**

```json
{
  "messages": [
    {
      "id": "cuid...",
      "content": "こんにちは",
      "createdAt": "2026-06-06T00:00:00.000Z",
      "channel": { "id": "cuid...", "name": "general" },
      "user": { "id": "cuid...", "displayName": "John", "avatarUrl": null }
    }
  ],
  "nextCursor": "cuid...",
  "hasMore": true
}
```

**Errors**
- `400` キーワードが2文字未満または100文字超過

---

## 通知

### GET /notifications

自分宛ての通知一覧を返す。

**Headers** `Authorization: Bearer {token}` 必須

**Query Parameters**

| パラメータ | 必須 | 説明 |
|---|---|---|
| cursor | 任意 | カーソルID |
| limit | 任意 | 取得件数（デフォルト20） |

**Response 200**

```json
{
  "notifications": [
    {
      "id": "cuid...",
      "type": "MENTION",
      "isRead": false,
      "createdAt": "2026-06-06T00:00:00.000Z",
      "message": { "id": "cuid...", "content": "@john hello", "channel": { "id": "cuid...", "name": "general" } },
      "actor": { "id": "cuid...", "displayName": "Jane", "avatarUrl": null }
    }
  ],
  "unreadCount": 3,
  "nextCursor": null,
  "hasMore": false
}
```

---

### PATCH /notifications/:id/read

通知を既読にする。

**Headers** `Authorization: Bearer {token}` 必須

**Response 200**

```json
{ "message": "既読にしました" }
```

---

### PATCH /notifications/read-all

全通知を既読にする。

**Headers** `Authorization: Bearer {token}` 必須

**Response 200**

```json
{ "message": "すべて既読にしました" }
```

---

## WebSocket イベント

WebSocket イベントの詳細は [websocket.md](./websocket.md) を参照。

| イベント（C→S） | 概要 |
|---|---|
| `message:send` | チャンネルメッセージ送信（添付ファイル対応） |
| `message:update` | メッセージ編集 |
| `message:delete` | メッセージ削除 |
| `thread:send` | スレッド返信送信 |
| `dm:send` | DMメッセージ送信 |
| `dm:update` | DMメッセージ編集 |
| `dm:delete` | DMメッセージ削除 |
| `reaction:toggle` | リアクションのトグル |
| `pin:add` | ピン追加 |
| `pin:remove` | ピン削除 |
| `typing:start` | タイピング開始 |
| `typing:stop` | タイピング停止 |
| `workspace:join` | ワークスペースルーム参加 |
| `channel:join` | チャンネルルーム参加 |
| `dm:join` | DM ルーム参加 |

| イベント（S→C） | 概要 |
|---|---|
| `message:received` | 新着メッセージ（チャンネル） |
| `message:updated` | メッセージ更新 |
| `message:deleted` | メッセージ削除 |
| `thread:reply_count_updated` | スレッド返信数更新 |
| `dm:received` | 新着DMメッセージ |
| `dm:updated` | DM更新 |
| `dm:deleted` | DM削除 |
| `reaction:updated` | リアクション更新（全絵文字の最新状態） |
| `pin:updated` | ピン追加/解除 |
| `typing:update` | タイピング中ユーザー一覧 |
| `presence:updated` | オンライン状態変化 |
| `notification:received` | 新着通知 |
