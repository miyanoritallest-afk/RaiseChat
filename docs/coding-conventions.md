# コーディング規約

> このドキュメントはフェーズ1（開発環境構築）完了後に詳細を追記する。
> 実装中に気づいたことを随時追記していく。

---

## 全体方針

- TypeScript strict modeを有効にする
- ESLint・Prettierの設定に従う（`.eslintrc` / `.prettierrc` を参照）
- Huskyによるコミット前の自動チェックを必ず通過させる

---

## バックエンド（NestJS）

### ファイル命名

| 種別 | 命名規則 | 例 |
|---|---|---|
| ファイル | kebab-case | `users.controller.ts` |
| クラス | PascalCase | `UsersController` |
| DTO | PascalCase + Dto | `CreateUserDto` / `UpdateUserDto` |
| インターフェース | PascalCase | `UserResponse` |

### 責務の分離ルール

- **Controller**：URLの受付・リクエストのバリデーション・レスポンスの整形のみ
- **Service**：ビジネスロジックのみ。DBの実装を知らない
- **Repository**：PrismaによるDB操作のみ。ビジネスロジックを持たない

> ❌ Serviceの中でPrismaを直接呼ばない
> ✅ ServiceはRepositoryのメソッドを呼ぶ

### 例外処理

NestJS標準の `HttpException` を使う。

```typescript
throw new HttpException('メッセージが見つかりません', HttpStatus.NOT_FOUND)
```

---

## フロントエンド（Next.js）

### ファイル命名

| 種別 | 命名規則 | 例 |
|---|---|---|
| コンポーネントファイル | PascalCase | `MessageList.tsx` |
| カスタムフック | useXxx形式 | `useMessages.ts` |
| ユーティリティ | camelCase | `formatDate.ts` |

### 型定義

- `interface` より `type` を優先する
- コンポーネントのPropsはファイル内で `type Props = {...}` と定義する

---

## ブランチ・コミット

### ブランチ命名規則

```
feature/{機能名}   新機能の開発
fix/{内容}         バグ修正
docs/{内容}        ドキュメント更新
refactor/{内容}    リファクタリング
```

### コミットメッセージ形式

```
feat: 認証機能を追加
fix: メッセージ送信時のバリデーションエラーを修正
docs: API仕様書を更新
refactor: MessageServiceのロジックを整理
```

### ブランチ運用ルール

- `main` ブランチへの直接コミット禁止
- 機能ごとに `feature/` ブランチを切って開発
- PRを通して `main` にマージする

---

## 開発順序

| フェーズ | 内容 |
|---|---|
| フェーズ1 | 開発環境構築・認証機能 |
| フェーズ2 | ワークスペース・チャンネル・メッセージ・リアルタイム通信 |
| フェーズ3 | スレッド・DM・通知 |
| フェーズ4 | リアクション・ピン留め・検索・ファイルアップロード・仕上げ |

### 1機能の開発サイクル

```
① featureブランチを切る
② バックエンドを実装する（Controller → Service → Repository）
③ フロントエンドを実装する
④ 動作確認する
⑤ PRを作ってmainにマージする
```
