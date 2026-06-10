# RaiseChat

Slack風チャットアプリケーション。
ワークスペース・チャンネル・DM・スレッド・リアルタイム通信を備えた本格的なビジネスチャットツール。

**本番URL**: http://raisechat-alb-1383858774.ap-northeast-1.elb.amazonaws.com  
**Swagger UI**: http://raisechat-alb-1383858774.ap-northeast-1.elb.amazonaws.com/api/docs

---

## 技術スタック

| 分類 | 技術 |
|---|---|
| フロントエンド | Next.js 15・TypeScript・Tailwind CSS・Zustand・shadcn/ui・framer-motion |
| バックエンド | NestJS・TypeScript・Socket.io・JWT + bcrypt・Prisma 6・Swagger・Sentry |
| データベース | PostgreSQL 16・Prisma |
| ストレージ | AWS S3（署名付きURL方式） |
| インフラ | AWS EC2（t3.small）・ALB・RDS（db.t3.micro）・ECR・Terraform |
| CI/CD | GitHub Actions（OIDC認証・ECRビルド・SSM SendCommand自動デプロイ） |
| 開発環境 | Docker・ESLint・Prettier・Husky・Jest・Playwright・k6 |

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
docker compose exec backend npx prisma migrate dev --schema ../../prisma/schema.prisma
```

| サービス | URL |
|---|---|
| フロントエンド | http://localhost:3000 |
| バックエンド API | http://localhost:4000/api |
| Swagger UI | http://localhost:4000/api/docs |

詳細は [docs/setup.md](docs/setup.md) を参照。

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

---

## 開発ステータス

### 機能実装フェーズ

| フェーズ | 内容 | 状態 |
|---------|------|------|
| フェーズ1 | 開発環境構築・認証機能 | ✅ 完了 |
| フェーズ2 | ワークスペース・チャンネル・メッセージ・リアルタイム通信 | ✅ 完了 |
| フェーズ3 | スレッド・DM・通知 | ✅ 完了 |
| フェーズ4 | リアクション・ピン留め・検索・ファイルアップロード | ✅ 完了 |

### 品質・インフラフェーズ

| フェーズ | 内容 | 状態 |
|---------|------|------|
| フェーズA | テスト戦略（静的解析・単体・結合・E2E・パフォーマンス） | ✅ 完了 |
| フェーズB | CI/CDパイプライン（GitHub Actions・nightly・deploy.yml） | ✅ 完了 |
| フェーズC | UI/UX改善（shadcn/ui・Skeletonローダー・framer-motion・DnD並び替え） | ✅ 完了 |
| Swagger / Sentry | APIドキュメント・エラートラッキング | ✅ 完了 |
| フェーズD | AWS Terraform インフラ構築・本番デプロイ | ✅ 完了 |
| フェーズE | セキュリティ強化・パフォーマンス計測 | ⏳ 未着手 |

---

## 実装済み機能一覧

- **認証**: ユーザー登録・ログイン・JWT認証
- **ワークスペース管理**: 作成・招待コード参加・メンバー管理・DnD並び替え
- **チャンネル管理**: パブリック/プライベートチャンネルのCRUD・参加・退出・DnD並び替え
- **メッセージング**: テキストチャット・編集・削除・カーソルベースページネーション
- **リアルタイム通信**: Socket.io による即時メッセージ反映・タイピングインジケーター・オンライン状態管理
- **スレッド**: メッセージへの返信・スレッドパネル（右側展開）
- **ダイレクトメッセージ**: 1対1DM・グループDM（ワークスペーススコープ）
- **通知**: メンション・未読・スレッド返信・リアクション通知・チャンネル訪問時自動既読化
- **リアクション**: 絵文字リアクション（トグル）
- **ピン留め**: チャンネル内メッセージのピン留め管理
- **検索**: ワークスペース横断メッセージ全文検索（Cmd+K対応）
- **ファイルアップロード**: AWS S3 を使った画像・動画添付（マジックバイト検証）
- **APIドキュメント**: Swagger UI（`/api/docs`）
- **エラー監視**: Sentry（本番環境）
