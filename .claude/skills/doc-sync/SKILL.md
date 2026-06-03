---
name: doc-sync
description: Check for divergences between the current implementation and docs/ documentation. Produces a diff report of what is out of date, then asks the user whether to auto-fix the docs to match the implementation.
---

# doc-sync

実装を正として、`docs/` 配下のドキュメントとの差異を検出し、必要に応じて自動修正する。

## Phase 1: 実装の現状を調査する

以下のファイルを読み込んで実装の現状を把握する：

### フロントエンド（Next.js）
- `package.json` — 依存パッケージとバージョン
- `src/types/index.ts` — 型定義（User, Post, Photo, Thread 等）
- `src/app/(tabs)/` — 画面構成（タブ・ルーティング）
- `src/components/PostCard.tsx` — 投稿カードの表示仕様
- `src/components/PostForm.tsx` — 投稿フォームの UI
- `src/components/TabiChanChat.tsx` — たびちゃんチャット UI

### データベース
- `prisma/schema.prisma` — テーブル定義・カラム型・リレーション

### ドキュメント
- `docs/requirements.md`
- `docs/features.md`
- `docs/screens.md`
- `docs/data-model.md`
- `docs/tech-stack.md`

## Phase 2: 差異レポートを作成する

以下の観点でドキュメントと実装を比較し、差異をまとめる：

| チェック項目 | 確認ポイント |
|-------------|-------------|
| **tech-stack.md** | ライブラリ名・バージョン、追加/削除された依存関係 |
| **features.md** | 機能の基本フロー（投稿・いいね・行きたい！・たびちゃん）が実装と一致しているか |
| **screens.md** | UI コンポーネントの操作方法、画面遷移が実装と一致しているか |
| **data-model.md** | Prisma スキーマのテーブル・カラム・リレーションと一致しているか |
| **requirements.md** | 技術スタック概要が実装と一致しているか |

差異がある場合は以下の形式でレポートする：

```
## ドキュメント差異レポート

### docs/tech-stack.md
- [差異] Leaflet のバージョンが「X.X」と記載されているが、実際は Y.Y で導入済み

### docs/data-model.md
- [差異] photos テーブルに pin_label カラムが追加されているがドキュメントに未記載

...（差異がなければ「差異なし」と記載）
```

差異がない場合は「すべてのドキュメントは実装と一致しています。」と報告して終了する。

## Phase 3: 自動修正の確認

差異がある場合、ユーザーに確認する：

```
上記の差異を自動修正しますか？
- はい：実装に合わせてドキュメントを修正します
- いいえ：レポートのみで終了します
```

ユーザーが「はい」を選択した場合のみ、Phase 4 を実行する。

## Phase 4: ドキュメントを自動修正する

差異ごとに Edit ツールで該当箇所を修正する。修正の原則：

1. **実装を正とする** — コードの挙動がドキュメントに優先する
2. **未実装機能の記述は変更しない** — 将来実装予定の機能記述はそのまま残す
3. **最小変更** — 差異がある箇所のみ修正し、周辺の文章は変えない
4. **日本語を維持** — ドキュメントの言語・文体をそのまま維持する

修正完了後、変更したファイルと変更箇所の一覧を報告する。
