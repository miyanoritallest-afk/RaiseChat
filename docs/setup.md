# 開発環境セットアップガイド

---

## 前提条件

- Docker Desktop インストール済み
- Node.js 20 以上 インストール済み
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

`.env` を開き、`JWT_SECRET` に任意の文字列を設定する（他の値はデフォルトで動作する）。

### 3. コンテナを起動

```bash
docker-compose up
```

| サービス | URL |
|---|---|
| フロントエンド | http://localhost:3000 |
| バックエンド API | http://localhost:4000 |
| PostgreSQL | localhost:5432 |

### 4. DBマイグレーション（初回のみ）

コンテナ起動後、別ターミナルで実行する。

```bash
docker-compose exec backend npm run prisma:migrate
```

マイグレーション名を聞かれたら `init` と入力する。

### 5. 動作確認

```bash
# ヘルスチェック
curl http://localhost:4000
# → {"status":"ok"}
```

---

## 環境変数の説明

| 変数名 | 説明 | デフォルト値 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 接続文字列 | `postgresql://postgres:postgres@db:5432/raisechat` |
| `JWT_SECRET` | JWT 署名用シークレット | 要設定 |
| `PORT` | バックエンドポート | `4000` |
| `NEXT_PUBLIC_API_URL` | フロントエンドからの API URL | `http://localhost:4000` |

---

## ローカル開発（Docker を使わない場合）

PostgreSQL をローカルで起動し、`.env` の `DATABASE_URL` をローカルの接続文字列に変更する。

```bash
# backend
cd apps/backend
npm install
npm run prisma:generate
npm run start:dev

# frontend（別ターミナル）
cd apps/frontend
npm install
npm run dev
```

---

## AWS S3 セットアップ（フェーズ4 以降）

> ファイルアップロード機能を使わない場合はスキップ可。フェーズ4完了後に詳細を追記予定。

---

## トラブルシューティング

### `docker-compose up` でコンテナが起動しない

- Docker Desktop が起動しているか確認する
- `docker-compose down -v` でボリュームを削除して再起動する

### `prisma migrate dev` でエラーが出る

- db コンテナが `healthy` 状態になるまで待ってから実行する
- `DATABASE_URL` が正しく設定されているか確認する
