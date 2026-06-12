# RaiseChat

Slack風チャットアプリケーション。ワークスペース・チャンネル・DM・スレッド・リアルタイム通信を備えた本格的なビジネスチャットツール。

**本番URL**: http://raisechat-alb-1383858774.ap-northeast-1.elb.amazonaws.com  
**Swagger UI**: http://raisechat-alb-1383858774.ap-northeast-1.elb.amazonaws.com/api/docs

---

## 主な機能

- **認証** — ユーザー登録・ログイン・JWT認証・プロフィール設定（アバター・ステータス）
- **ワークスペース管理** — 作成・招待コード参加・メンバー管理・DnD並び替え
- **チャンネル管理** — パブリック/プライベートチャンネルのCRUD・参加・退出・DnD並び替え
- **メッセージング** — テキストチャット・編集・削除・マークダウン対応・カーソルベースページネーション
- **リアルタイム通信** — Socket.io による即時メッセージ反映・タイピングインジケーター・オンライン状態管理
- **スレッド** — メッセージへの返信・チャンネルタイムラインへの同時投稿・スレッドパネル（右側展開）
- **ダイレクトメッセージ** — 1対1DM・グループDM（ワークスペーススコープ）
- **通知** — メンション・未読・スレッド返信・リアクション通知・チャンネル訪問時自動既読化
- **リアクション** — 絵文字リアクション（トグル）
- **ピン留め** — チャンネル内メッセージのピン留め管理
- **検索** — ワークスペース横断メッセージ全文検索（Cmd+K対応）
- **ファイルアップロード** — AWS S3 を使った画像・動画添付（マジックバイト検証）
- **APIドキュメント** — Swagger UI（`/api/docs`）
- **エラー監視** — Sentry（本番環境）

---

## 技術スタック

| 分類 | 技術 |
|---|---|
| フロントエンド | Next.js 15・TypeScript・Tailwind CSS・Zustand・shadcn/ui・framer-motion |
| バックエンド | NestJS・TypeScript・Socket.io・JWT + bcrypt・Prisma 6・Swagger・Sentry |
| データベース | PostgreSQL 16 |
| ストレージ | AWS S3（署名付きURL方式） |
| インフラ | AWS EC2（t3.small）・ALB・RDS（db.t3.micro）・ECR・Terraform |
| CI/CD | GitHub Actions（OIDC認証・ECRビルド・SSM SendCommand自動デプロイ） |
| 開発環境 | Docker・ESLint・Prettier・Husky・Jest・Playwright・k6 |

---

## プロジェクト構成

```
apps/
├── backend/src/
│   ├── auth/          # 認証（JWT発行・検証・bcrypt）
│   ├── users/         # ユーザー管理
│   ├── workspaces/    # ワークスペース管理
│   ├── channels/      # チャンネル管理
│   ├── messages/      # チャンネルメッセージ管理
│   ├── reactions/     # 絵文字リアクション
│   ├── pins/          # メッセージピン留め
│   ├── search/        # メッセージ全文検索
│   ├── dm-rooms/      # ダイレクトメッセージ
│   ├── notifications/ # 通知
│   ├── uploads/       # ファイルアップロード（S3連携）
│   └── gateway/       # Socket.ioイベント管理
│
└── frontend/src/
    ├── app/
    │   ├── (auth)/               # 認証系（ログイン・新規登録）
    │   ├── workspaces/           # WS選択・作成
    │   └── [workspaceId]/        # チャット画面
    │       ├── [channelId]/      # チャンネル指定
    │       └── dm/[dmRoomId]/    # DM画面
    ├── components/
    │   ├── layout/               # サイドバー・レイアウト
    │   ├── message/              # メッセージ関連
    │   ├── channel/              # チャンネル関連
    │   ├── search/               # 検索モーダル
    │   ├── notification/         # 通知
    │   └── thread/               # スレッドパネル
    ├── hooks/                    # カスタムフック
    ├── stores/                   # Zustand（クライアント状態管理）
    ├── types/                    # 型定義
    └── lib/api/                  # エンドポイント別APIクライアント

prisma/                           # DBスキーマ
terraform/                        # AWSインフラ構成（EC2・RDS・S3・VPC・IAM）
docker-compose.yml                # 開発環境（Frontend・Backend・PostgreSQL）
.github/workflows/                # CI（PR）・nightly・deploy
```

---

## ローカル起動手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/miyanoritallest-afk/RaiseChat.git
cd RaiseChat

# 2. 環境変数を設定
cp .env.example .env
# .env の JWT_SECRET を任意の文字列に設定する（他はデフォルトで動作）

# 3. 起動
docker compose up

# 4. DBマイグレーション（初回のみ・別ターミナルで）
docker compose exec backend npx prisma migrate dev --schema /app/prisma/schema.prisma
```

| サービス | URL |
|---|---|
| フロントエンド | http://localhost:3000 |
| バックエンド API | http://localhost:4000/api |
| Swagger UI | http://localhost:4000/api/docs |

詳細は [docs/setup.md](docs/setup.md) を参照。

---

## 拡張候補機能

現スコープでは未実装だが、検討・設計レベルで把握している拡張ポイント。

| 機能 | 概要 |
|------|------|
| セキュリティ強化 | HTTPS/TLS対応（ACM + Route53）・セキュリティヘッダー強化 |
| パフォーマンス計測 | Lighthouse・k6負荷試験の本番計測・ボトルネック改善 |
| Redisキャッシュ | チャンネル一覧・プロフィール等のDBクエリ結果をキャッシュしDB負荷を軽減 |
| Socket.io スケールアウト | Redis PubSubを使って複数EC2でWebSocket接続を共有 |
| HTTPS対応 | ドメイン取得後にACM証明書 + Route53で独自ドメイン化 |

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
| [docs/devlog.md](docs/devlog.md) | 技術的意思決定の記録（100件） |
| [docs/development-status.md](docs/development-status.md) | 開発フェーズの進捗履歴 |
