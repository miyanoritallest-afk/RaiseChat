# アーキテクチャ設計書

> 技術選定の詳細な意思決定プロセスは [devlog.md](./devlog.md) を参照。

---

## 1. システム全体構成

```
ブラウザ
  │
  ├── HTTP（REST API）
  │     ↓
  │  ALB（HTTP:80）
  │     ↓
  │  Nginx（EC2:80）
  │     ├── /api/* → NestJS（localhost:4000）
  │     │     ├── Controller / Service / Repository（三層構造）
  │     │     ├── JWT認証ガード
  │     │     ├── Prisma → RDS PostgreSQL 16
  │     │     └── AWS S3（署名付きURL方式）
  │     └── /*   → Next.js（localhost:3000）
  │
  └── WebSocket（Socket.io）
        ↕ リアルタイム通信
     Nginx: /socket.io/* → NestJS Gateway（同一EC2）
```

### 環境別の構成

| 環境 | フロントエンド | バックエンド | DB |
|---|---|---|---|
| 開発環境 | Docker（localhost:3000） | Docker（localhost:4000） | Docker PostgreSQL（localhost:5432） |
| 本番環境 | EC2（Next.js standalone + Nginx） | EC2（NestJS + Nginx、同居） | RDS PostgreSQL 16（ap-northeast-1a） |

### 本番環境の詳細

| リソース | 詳細 |
|---|---|
| EC2 | t3.small、Amazon Linux 2023、ap-northeast-1a |
| ALB | raisechat-alb-1383858774.ap-northeast-1.elb.amazonaws.com |
| RDS | db.t3.micro、PostgreSQL 16、シングルAZ |
| ECR | `<ACCOUNT_ID>`.dkr.ecr.ap-northeast-1.amazonaws.com/raisechat-{backend,frontend} |
| S3 | raisechat-uploads-`<ACCOUNT_ID>` |
| Terraform state | S3: raisechat-terraform-state-`<ACCOUNT_ID>` |
| CD | GitHub Actions OIDC認証 → ECR push → SSM SendCommand でEC2更新 |

---

## 2. 技術スタック選定理由

### フロントエンド：Next.js + TypeScript

- Slack・Discord・Microsoft Teams全てがReact系を採用しており業界標準
- App RouterによるSSR・ファイルベースルーティングで開発効率が高い
- TypeScriptで型安全なコードが書け、バグを早期に発見できる
- 日本の求人市場での需要が高くポートフォリオとして評価される

### バックエンド：NestJS

- Controller・Service・Repositoryの三層構造が強制され現場レベルの設計を学べる
- TypeScriptで統一できるためフロントとバックで言語を切り替える必要がない
- Socket.ioを公式サポートしており組み込みで使える
- Angularライクなモジュールシステムが大規模開発にも通用する

**Expressではない理由**：自由度が高い反面、設計が開発者によってバラバラになりやすく個人開発での設計品質を保ちにくいため。

**Supabaseを使わない理由**：認証・リアルタイム通信・DBの仕組みがBaaSに隠蔽されてしまい、「自分で設計・実装できる」というポートフォリオとしての証明にならないため。

### データベース：PostgreSQL + Prisma

- ユーザー・ワークスペース・チャンネル・メッセージが複雑に関連するためRDBが適している
- SQLの知識は現場で必須であり学習価値が高い
- PrismaによりTypeScriptの型補完が効き、タイポによるバグを防げる
- `prisma migrate` でスキーマの変更履歴を管理できる

### リアルタイム通信：Socket.io

- WebSocketをラップした高レベルなライブラリで再接続処理が標準搭載
- **ルーム機能**がSlackのチャンネル構造と完全に一致し実装しやすい
- NestJSがWebSocketGatewayとして公式サポート

### ファイルストレージ：AWS S3

- 画像・動画をDBやサーバーに保存せず専用ストレージで管理
- 業界標準のクラウドストレージであり採用担当者への訴求力がある
- S3キーをDBに保存・署名付きURLは読み取り時生成（URLの有効期限問題を回避）

### インフラ：Terraform + GitHub Actions

- VPC・EC2・ALB・RDS・ECR・S3・IAMを全てTerraformでコード管理（Infrastructure as Code）
- GitHub Actions OIDC認証によりAWSアクセスキーなしでECRへのpushが可能
- mainブランチへのマージで自動デプロイ（ECRイメージビルド → SSM SendCommandでEC2更新）
- SSM Session Managerでキーレス・踏み台なしのEC2アクセスを実現

---

## 3. バックエンド設計

### 三層構造（Controller / Service / Repository）

```
リクエスト
    ↓
Controller（URLの受付・バリデーション）
    ↓
Service（ビジネスロジック）
    ↓
Repository（DBへの読み書き）
    ↓
Prisma → PostgreSQL
```

**この構造を採用した理由**：
- 責務が明確に分離されており、変更の影響範囲が小さい
- ServiceはDBの実装を知らず、Repositoryだけが知ることで差し替えが容易
- テストを書く際にServiceのみをテストしやすい

### モジュール構成

```
backend/src/
├── auth/          # 認証（JWT発行・検証・bcrypt）
├── users/         # ユーザー管理
├── workspaces/    # ワークスペース管理
├── channels/      # チャンネル管理
├── messages/      # チャンネルメッセージ管理
├── reactions/     # 絵文字リアクション
├── pins/          # メッセージピン留め
├── uploads/       # ファイルアップロード（S3連携）
├── search/        # メッセージ全文検索
├── dm-rooms/      # ダイレクトメッセージ
├── notifications/ # 通知
└── gateway/       # Socket.ioイベント管理
```

各モジュールは `controller.ts` / `service.ts` / `repository.ts` / `module.ts` の4ファイルで構成。`uploads/` には `s3.service.ts` も含む。

### 認証フロー

```
1. ログイン
   POST /auth/login → パスワードをbcryptで検証 → JWTトークンを返却

2. 認証が必要なリクエスト
   Authorization: Bearer {token} → JwtGuardでトークン検証 → ユーザー情報をリクエストに付与

3. ソケット接続の認証
   socket.handshake.auth.token → JWTを検証 → 認証済みユーザーとして接続
```

---

## 4. フロントエンド設計

### ディレクトリ構成

```
frontend/src/
├── app/                      # App Router（画面）
│   ├── (auth)/               # 認証系（ログイン・新規登録）
│   ├── workspaces/           # WS選択・作成
│   └── [workspaceId]/        # チャット画面
│       ├── [channelId]/      # チャンネル指定
│       └── dm/[dmRoomId]/    # DM画面
├── components/               # UIコンポーネント
│   ├── layout/               # サイドバー・レイアウト（検索ボタン含む）
│   ├── message/              # メッセージ関連（ReactionBar・EmojiPickerButton・AttachmentDisplay等）
│   ├── channel/              # チャンネル関連（PinnedMessagesPanel等）
│   ├── dm/                   # DM関連
│   ├── search/               # 検索モーダル（SearchModal・SearchResultItem）
│   ├── notification/         # 通知ベル・通知一覧
│   └── thread/               # スレッドパネル
├── hooks/                    # カスタムフック（useMessages・useSearch・useReaction等）
├── stores/                   # クライアント状態管理（Zustand）
├── types/                    # 型定義（search.ts・pin.ts等）
└── lib/                      # API通信・Socket.io接続
    └── api/                  # エンドポイント別クライアント（search.api.ts・reaction.api.ts等）
```

### URLとページの対応

| URL | 画面 |
|---|---|
| /login | ログイン画面 |
| /register | 新規登録画面 |
| /workspaces | ワークスペース選択画面 |
| /workspaces/new | ワークスペース作成画面 |
| /[workspaceId]/[channelId] | チャット画面（チャンネル） |
| /[workspaceId]/dm/[dmRoomId] | チャット画面（DM） |

### 状態管理の方針

| 状態の種類 | 管理方法 |
|---|---|
| サーバーデータ（メッセージ・チャンネル一覧） | API取得 + Socket.ioでリアルタイム更新 |
| UIの状態（モーダルの開閉・選択中チャンネル） | クライアント状態管理（stores/） |
| 認証状態（ログインユーザー情報） | stores/ + JWTトークンをlocalStorage管理 |

---

## 5. リアルタイム通信設計

### REST APIとSocket.ioの使い分け

| 用途 | 使用技術 | 理由 |
|---|---|---|
| データの取得・作成・更新・削除 | REST API | ブラウザ起点の操作はHTTPが適切 |
| メッセージのリアルタイム配信 | Socket.io | サーバーから全員にプッシュする必要がある |
| タイピングインジケーター | Socket.io | 一時的な状態をDBを介さず配信する |
| オンライン状態の通知 | Socket.io | 接続・切断イベントを全員にプッシュする |

### ルーム設計

Socket.ioの「ルーム」をSlackのチャンネルに対応させる。

```
workspace:{workspaceId}  → ワークスペース全体への通知
channel:{channelId}      → チャンネル内のメッセージ配信
dm:{dmRoomId}            → DM内のメッセージ配信
```

**例：メッセージ送信時のフロー**
```
クライアントA が message:send を送信
    ↓
サーバーでDBに保存
    ↓
channel:{channelId} ルーム全員に message:received を配信
    ↓
クライアントA・B・C の画面にリアルタイムで表示
```

---

## 6. DB設計

### テーブル一覧

| テーブル名 | 概要 |
|---|---|
| users | ユーザー |
| workspaces | ワークスペース |
| workspace_members | ワークスペース所属・権限管理（中間テーブル） |
| channels | チャンネル |
| channel_members | チャンネル所属（中間テーブル） |
| messages | チャンネルメッセージ・スレッド返信を兼用 |
| message_attachments | チャンネルメッセージの添付ファイル |
| reactions | 絵文字リアクション |
| pins | ピン留め |
| dm_rooms | DMルーム（1対1・グループDM） |
| dm_room_members | DM参加者（中間テーブル） |
| dm_messages | DMメッセージ |
| dm_message_attachments | DMメッセージの添付ファイル |
| notifications | 通知 |

スキーマの詳細は [prisma/schema.prisma](../prisma/schema.prisma) を参照。

### 主要な設計判断

**ピン留め状態は Pin テーブルのレコード有無で判定する**
`Message.isPinned` フラグを持たず、`Pin` テーブルにレコードが存在するかどうかだけでピン留め状態を判定する。フラグとテーブルの二重管理による不整合を防ぐため。

**スレッドはmessagesテーブルで自己参照**
```
messages.thread_id → messages.id（自己参照）
親メッセージ：thread_id = null
返信メッセージ：thread_id = 親メッセージのid
```
threadsテーブルを別に作らない理由：テーブルを増やす複雑さより可読性を優先した。ポートフォリオスコープでは十分な設計。

**DMをチャンネルメッセージと別テーブルで管理**
チャンネルメッセージとDMを共通テーブルにすると `channel_id` か `dm_id` のどちらかが必ずNULLになる不自然なデータ構造になるため分離した。

**カーソルベースのページネーション**
チャットアプリは上スクロールで過去メッセージを読む無限スクロールUIが自然。ページ番号方式だとリアルタイムでメッセージが追加された際にページのズレが発生するためカーソルベースを採用。

**ファイル添付：S3キーをDBに保存、署名付きURLは読み取り時生成**
`message_attachments.file_url` にはS3キー（`{workspaceId}/{uuid}.ext`）を保存し、クライアントへのレスポンス時に1時間有効の署名付きURLへ変換する。URL有効期限切れを防ぎ、バケット移行時もDB変更不要。

---

## 7. セキュリティアーキテクチャ

### IDOR（Insecure Direct Object Reference）対策の2層構造

フェーズ2〜4を通して一貫して採用している多層防御パターン。

```
Layer1: Guard（NestJS @UseGuards）
  ↓ メンバーシップの確認
  WorkspaceMemberGuard — ワークスペースメンバーかどうか
  ChannelMemberGuard   — チャンネルメンバーかどうか
  DmRoomMemberGuard    — DM ルームメンバーかどうか

Layer2: Service / Repository の where 条件
  ↓ リソースの親子関係を DB で検証
  message.channelId !== channelId → 404
  pin.channel.workspaceId から取得した workspaceId を isOwner に渡す
  s3Key.startsWith(`${channel.workspaceId}/`) → WsException
  検索: channel.OR = [{ isPrivate: false }, { members: { some: { userId } } }]
```

**原則**：URLパラメータ（`:wsId`, `:channelId`）は攻撃者が操作できる入力値であり、権限チェックに直接使ってはならない。常にDBから辿ったリソースの実際の親IDを使う。

### ファイルアップロードのセキュリティ

```
1. MIME タイプ許可リスト（Multer fileFilter）
   → image/jpeg, png, gif, webp, video/mp4, webm のみ

2. マジックバイト検証（自前実装）
   → ファイルヘッダーで実際の形式を確認（Content-Type 偽装対策）

3. ファイルサイズ制限（Multer limits）
   → 画像: 10MB / 動画: 100MB

4. S3 キーのパストラバーサル対策
   → @Matches(/^[^./\\][^/\\]*\/[^./\\][^/\\]*$/) でバリデーション

5. ワークスペース間の S3 キー流用防止
   → s3Key.startsWith(`${channel.workspaceId}/`) を WS 境界で検証
```

---

## 8. 画面設計

### 画面一覧

| 画面名 | 概要 | 遷移元 |
|---|---|---|
| ログイン画面 | ユーザーID・パスワードでログイン | アプリ起動時 |
| 新規登録画面 | ユーザーID・表示名・パスワードで登録 | ログイン画面 |
| ワークスペース選択画面 | 参加中のWS一覧・招待コードで参加・WS作成 | ログイン後 |
| ワークスペース作成画面 | WS名・説明・アイコンを設定して作成 | WS選択画面 |
| チャット画面 | メイン画面。チャンネル・DM・スレッド | WS選択後 |

### 画面遷移

```
アプリ起動
  ├── ログイン画面
  │     └── ワークスペース選択画面
  └── 新規登録画面
        └── ワークスペース選択画面
              ├── ワークスペース作成画面
              │     └── チャット画面
              └── チャット画面
```

### チャット画面レイアウト

```
┌──┬───────────────┬──────────────────────────┬────────────┐
│WS│ サイドバー     │ メッセージエリア            │ スレッド   │
│  │               │                          │ ペイン     │
│🅰 │ 🔍 検索 ⌘K    │ # チャンネル名  📌        │（返信時に  │
│  │               │                          │  右側展開）│
│🅱 │ チャンネル     │ メッセージ一覧            │            │
│  │ # general 🔴3 │ （未読：太字＋数字バッジ） │            │
│🅲 │ **# dev**     │ （メンション：数字バッジ） │            │
│  │ ＋ 追加        │ 😊👍×3 ❤️×1           │            │
│＋ │               │ ──────────────────────── │            │
│  │ DM            │ ┌──────────────────────┐ │            │
│  │ 👤 田中さん   │ │ メッセージを入力...   │ │            │
│  │ ＋ 追加        │ │ 📎 😊 **B** @        │ │            │
│  │ ────────────  │ └──────────────────────┘ │            │
│  │ 👤 自分 ●     │                          │            │
└──┴───────────────┴──────────────────────────┴────────────┘
  ↑
  WSアイコン縦並び・クリックで即切り替え・＋でWS作成/参加
  サイドバー上部の検索ボタンまたは ⌘K で全文検索モーダルを開く
```

### モーダル一覧

| モーダル名 | 開き方 | 編集権限 |
|---|---|---|
| プロフィール設定 | サイドバー下部の自分のアイコンをクリック | 本人のみ |
| ワークスペース設定 | サイドバー上部のWS名をクリック | オーナーのみ |
| メンバー招待 | WS設定モーダルの「招待する」ボタン | オーナーのみ |
| チャンネル作成 | サイドバーのチャンネル「＋追加」をクリック | オーナーのみ |
| チャンネル設定 | サイドバーのチャンネル名を右クリック | オーナーのみ（全員閲覧可） |
| DM作成 | サイドバーのDM「＋追加」をクリック | - |
| メッセージ検索 | サイドバー検索ボタン or ⌘K / Ctrl+K | - |
| 絵文字ピッカー | メッセージホバー時の「😊」ボタン | - |
| ピン一覧パネル | チャンネルヘッダーの📌アイコン | - |
