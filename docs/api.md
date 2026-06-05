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

### ページネーション（カーソルベース）

```
GET /channels/:channelId/messages?cursor={messageId}&limit=50
```

| パラメータ | 必須 | 概要 |
|---|---|---|
| cursor | 任意 | 最後に取得したメッセージID。省略時は最新50件を取得 |
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

### GET /users/me

> 未実装（GET /auth/me で代替）

### PATCH /users/me

> 未実装

### GET /users/:userId

> 未実装

---

## ワークスペース

### GET /workspaces

> 未実装

### POST /workspaces

> 未実装

### GET /workspaces/:wsId

> 未実装

### PATCH /workspaces/:wsId

> 未実装

### GET /workspaces/:wsId/members

> 未実装

### POST /workspaces/:wsId/members/invite

> 未実装

### DELETE /workspaces/:wsId/members/:userId

> 未実装

### POST /workspaces/join

> 未実装

---

## チャンネル

### GET /workspaces/:wsId/channels

> 未実装

### POST /workspaces/:wsId/channels

> 未実装

### GET /workspaces/:wsId/channels/:channelId

> 未実装

### PATCH /workspaces/:wsId/channels/:channelId

> 未実装

### DELETE /workspaces/:wsId/channels/:channelId

> 未実装

### POST /workspaces/:wsId/channels/:channelId/join

> 未実装

### DELETE /workspaces/:wsId/channels/:channelId/leave

> 未実装

---

## メッセージ

### GET /channels/:channelId/messages

> 未実装

### POST /channels/:channelId/messages

> 未実装

### PATCH /channels/:channelId/messages/:msgId

> 未実装

### DELETE /channels/:channelId/messages/:msgId

> 未実装

### GET /channels/:channelId/messages/:msgId/threads

> 未実装

### GET /channels/:channelId/pins

> 未実装

### POST /channels/:channelId/messages/:msgId/pin

> 未実装

### DELETE /channels/:channelId/messages/:msgId/pin

> 未実装

### POST /channels/:channelId/messages/:msgId/reactions

> 未実装

### DELETE /channels/:channelId/messages/:msgId/reactions

> 未実装

---

## DM

### GET /dm/rooms

> 未実装

### POST /dm/rooms

> 未実装

### GET /dm/rooms/:roomId/messages

> 未実装

### POST /dm/rooms/:roomId/messages

> 未実装

### PATCH /dm/rooms/:roomId/messages/:msgId

> 未実装

### DELETE /dm/rooms/:roomId/messages/:msgId

> 未実装

---

## 検索

### GET /workspaces/:wsId/search

> 未実装

---

## 通知

### GET /notifications

> 未実装

### PATCH /notifications/:id/read

> 未実装

### PATCH /notifications/read-all

> 未実装

---

## ファイルアップロード

### POST /upload/image

> 未実装

### POST /upload/video

> 未実装
