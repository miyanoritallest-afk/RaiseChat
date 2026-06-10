# コーディング規約


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

## 開発フェーズ（完了済み）

| フェーズ | 内容 | 状態 |
|---|---|---|
| フェーズ1 | 開発環境構築・認証機能 | ✅ 完了 |
| フェーズ2 | ワークスペース・チャンネル・メッセージ・リアルタイム通信 | ✅ 完了 |
| フェーズ3 | スレッド・DM・通知 | ✅ 完了 |
| フェーズ4 | リアクション・ピン留め・検索・ファイルアップロード・仕上げ | ✅ 完了 |
| フェーズA | テスト戦略（単体・結合・E2E・パフォーマンス） | ✅ 完了 |
| フェーズB | CI/CDパイプライン（GitHub Actions） | ✅ 完了 |
| フェーズC | UI/UX改善（shadcn/ui・Skeleton・framer-motion・DnD並び替え） | ✅ 完了 |
| Swagger/Sentry | APIドキュメント・エラートラッキング | ✅ 完了 |
| フェーズD | AWS Terraform インフラ構築・本番デプロイ | ✅ 完了 |
| フェーズE | セキュリティ強化・計測 | ⏳ 未着手 |

### 1機能の開発サイクル

```
① feature/{内容} ブランチを切る
② バックエンドを実装する（Controller → Service → Repository）
③ フロントエンドを実装する
④ 動作確認する（ローカル or 本番）
⑤ PRを作ってCI（型チェック・Lint・単体テスト）を通す
⑥ mainにマージ → 自動デプロイ（ECRビルド → EC2更新）
```
