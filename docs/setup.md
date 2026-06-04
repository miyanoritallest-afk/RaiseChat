# 開発環境セットアップガイド

> このドキュメントはフェーズ1（開発環境構築）完了後に詳細を追記する。

---

## 前提条件

- Docker Desktop インストール済み
- Node.js 20以上 インストール済み
- AWS アカウント（ファイルアップロード機能を使う場合のみ）

---

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/miyanoritallest-afk/RaiseChat.git
cd RaiseChat
```

### 2. 環境変数を設定

```bash
cp .env.example .env
```

`.env` を開き、各値を設定する（詳細は下記「環境変数の設定方法」を参照）。

### 3. 起動

```bash
docker-compose up
```

| サービス | URL |
|---|---|
| フロントエンド | http://localhost:3000 |
| バックエンドAPI | http://localhost:4000 |
| PostgreSQL | localhost:5432 |

### 4. DBマイグレーション

> 初回起動時のみ実行する。

```bash
# （コンテナ起動後に別ターミナルで実行）
docker-compose exec backend npx prisma migrate dev
```

---

## 環境変数の設定方法

> 詳細は実装フェーズ完了後に追記予定。

```bash
# DB接続（docker-composeで自動設定されるため変更不要）
DATABASE_URL="postgresql://user:password@db:5432/raisechat"

# JWT署名に使うシークレットキー（任意の文字列を設定）
JWT_SECRET=""

# AWS S3（ファイルアップロード機能を使う場合のみ設定）
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET_NAME=""
AWS_REGION=""
```

---

## AWS S3セットアップ（オプション）

> ファイルアップロード機能を使わない場合はスキップ可。
> 詳細は実装フェーズ完了後に追記予定。

---

## トラブルシューティング

> 実装フェーズで発生した問題と解決策を随時追記予定。
