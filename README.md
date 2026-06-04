# RaiseChat

Slack風チャットアプリケーション。
ワークスペース・チャンネル・DM・スレッド・リアルタイム通信を備えた本格的なビジネスチャットツール。

---

## 技術スタック

| 分類 | 技術 |
|---|---|
| フロントエンド | Next.js・TypeScript |
| バックエンド | NestJS・TypeScript・Socket.io・JWT + bcrypt |
| データベース | PostgreSQL・Prisma |
| ストレージ | AWS S3 |
| ホスティング | Vercel（フロント）・Render（バックエンド） |
| 開発環境 | Docker・ESLint・Prettier・Husky |

---

## ローカル起動手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/miyanoritallest-afk/RaiseChat.git
cd RaiseChat

# 2. 環境変数を設定
cp .env.example .env
# .env の各値を設定する（詳細は docs/setup.md を参照）

# 3. 起動
docker-compose up
```

詳細なセットアップ手順は [docs/setup.md](docs/setup.md) を参照。

---

## ドキュメント

| ドキュメント | 概要 |
|---|---|
| [docs/requirements.md](docs/requirements.md) | 機能要件・非機能要件・制約条件 |
| [docs/architecture.md](docs/architecture.md) | システム構成・技術選定理由・DB設計・画面設計 |
| [docs/api.md](docs/api.md) | APIエンドポイント仕様（Request / Response） |
| [docs/websocket.md](docs/websocket.md) | Socket.ioイベント仕様（Payload・配信先） |
| [docs/setup.md](docs/setup.md) | 開発環境構築手順 |
| [docs/coding-conventions.md](docs/coding-conventions.md) | コーディング規約・ブランチ戦略 |
| [docs/devlog.md](docs/devlog.md) | 技術的意思決定の記録 |

---

## 開発ステータス

> 要件定義フェーズ完了・開発準備中

| フェーズ | 内容 | 状態 |
|---|---|---|
| フェーズ1 | 開発環境構築・認証機能 | 準備中 |
| フェーズ2 | ワークスペース・チャンネル・メッセージ・リアルタイム通信 | 未着手 |
| フェーズ3 | スレッド・DM・通知 | 未着手 |
| フェーズ4 | リアクション・ピン留め・検索・ファイルアップロード・仕上げ | 未着手 |
