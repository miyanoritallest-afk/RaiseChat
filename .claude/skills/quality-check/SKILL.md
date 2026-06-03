---
name: quality-check
description: Run all quality checks for TripDiary — TypeScript type check, ESLint, and Vitest unit tests. Use before creating a PR or when asked to run tests/quality checks.
---

# quality-check

TypeScript の型チェック・ESLint・Vitest ユニット/結合テストを順番に実行し、結果を報告する。

## テスト構成

| 種別 | ディレクトリ | 内容 |
|------|------------|------|
| ユニットテスト | `src/__tests__/unit/` | 純粋関数・ライブラリのロジック（例: `mappers.test.ts`） |
| 結合テスト | `src/__tests__/integration/` | API Route のモックを使ったリクエスト/レスポンス検証 |
| コンポーネントテスト | `src/**/*.test.tsx` | React Testing Library を使った UI 検証 |

## 実行ステップ

### Step 1: TypeScript 型チェック

```bash
npm run typecheck
```

（実体: `tsc --noEmit`）

- エラーがなければ ✅
- エラーがあれば、ファイル名・行番号・エラー内容を列挙する

### Step 2: ESLint

```bash
npm run lint
```

適用ルール:
- `next/core-web-vitals` + `next/typescript`
- `@typescript-eslint/no-unused-vars` (error)
- `@typescript-eslint/no-explicit-any` (error)
- `@typescript-eslint/consistent-type-imports` (error) — type-only import は `import type` を強制
- `no-console` (warn, allow: warn/error)
- テストファイルに `plugin:testing-library/react` 適用

自動修正可能な問題は `npm run lint:fix` で一括修正できる。

- 警告・エラーがなければ ✅
- 問題があれば、ファイル名・ルール名・内容を列挙する

### Step 3: Vitest テスト

```bash
npm run test
```

カバレッジ込みで実行する場合:
```bash
npm run test:coverage
```

- テスト結果（PASS/FAIL 件数）を報告する
- 失敗したテストがあれば、テスト名とエラー内容を列挙する

### 一括実行（全チェック）

```bash
npm run check
```

（実体: `npm run typecheck && npm run lint && npm run test`）

## 結果の報告

以下の形式で報告する：

```
## 品質チェック結果

### TypeScript 型チェック
- ✅ 型エラーなし  /  ❌ N件のエラー: <ファイル名・内容>

### ESLint
- ✅ 問題なし  /  ⚠️ N件の警告  /  ❌ N件のエラー: <内容>

### Vitest
- ✅ 全N件 PASS (unit: N, integration: N)  /  ❌ N件 FAIL: <テスト名・エラー内容>
```

すべてパスした場合：「型チェック・Lint・テストがすべてパスしました。PR を作成できる状態です。」と報告する。

失敗があった場合：「N件の問題があります。PR を作成する前に修正してください。」と報告し、修正を提案する。

## 新規テストを追加する際のガイドライン

- **ユニットテスト対象**: `src/lib/` 以下の純粋関数（DB・外部APIを呼ばないもの）
- **結合テスト対象**: `src/app/api/` の Route Handler — Prisma と next-auth を `vi.mock()` でモック
- **コンポーネントテスト対象**: `src/components/` の React コンポーネント — `@testing-library/react` を使用
- テストファイル名は `*.test.ts` / `*.test.tsx` とする
- モックは `vi.mock()` を使い、各テストの `beforeEach` で `vi.clearAllMocks()` を呼ぶ
