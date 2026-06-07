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
| フェーズA | テスト戦略（静的解析・単体・結合・E2E・パフォーマンス） | 🚧 進行中 |
| フェーズB | CI/CDパイプライン構築 | ⏳ 未着手 |
| フェーズC | UI/UX改善・手動テスト | ⏳ 未着手 |
| フェーズD | インフラ構築・デプロイ（Vercel + Render） | ⏳ 未着手 |
| フェーズE | セキュリティ強化・パフォーマンス計測 | ⏳ 未着手 |

### 現場対応追加項目

| 項目 | 内容 | 状態 |
|-----|------|------|
| APIドキュメント | Swagger（@nestjs/swagger） | ⏳ 未着手 |
| エラー監視 | Sentry導入（本番環境） | ⏳ 未着手 |
| READMEの充実 | アーキテクチャ図・環境変数説明 | ⏳ 未着手 |

### 実装済み機能一覧

- **認証**: ユーザー登録・ログイン・JWT認証
- **ワークスペース管理**: 作成・招待コード参加・メンバー管理
- **チャンネル管理**: パブリック/プライベートチャンネルのCRUD・参加・退出
- **メッセージング**: テキストチャット・編集・削除・カーソルベースページネーション
- **リアルタイム通信**: Socket.io による即時メッセージ反映・タイピングインジケーター・オンライン状態管理
- **スレッド**: メッセージへの返信・スレッドビュー
- **ダイレクトメッセージ**: 1対1DM・グループDM
- **通知**: メンション・未読・スレッド返信・リアクション通知
- **リアクション**: 絵文字リアクション（トグル）
- **ピン留め**: チャンネル内メッセージのピン留め管理
- **検索**: ワークスペース横断メッセージ全文検索
- **ファイルアップロード**: AWS S3 を使った画像・動画添付
