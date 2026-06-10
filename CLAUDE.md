# RaiseChat — Claude Code Instructions

## Git ルール

- main ブランチへの直接プッシュ禁止
- 作業は必ず feature ブランチを切って、PR を通してマージすること

---

## フェーズ実装計画（2026-06-08 策定）

### 実施順序

```
フェーズA: テスト戦略                ✅ 完了（PR #20〜#24）
    ↓
フェーズB: CI/CDパイプライン         ✅ 完了
    ↓
フェーズC: UI/UX改善                ✅ 完了（PR #34〜#40）
    ↓
Swagger / Sentry 組み込み           ✅ 完了（PR #41）
    ↓
フェーズD: Terraform構築 → 本番デプロイ  ⏳ 次に着手
    ↓
フェーズE: セキュリティ強化・計測    ⏳ 未着手（本番稼働後）
```

### 進め方のルール

- **1フェーズ = 1PR** で進める（現場のリズムに合わせる）
- 各フェーズは `feature/phase-X-xxx` ブランチを切って実装 → PR作成 → CI/Claude Review通過 → main マージ
- デプロイ（フェーズD）を後回しにする理由：機能が固まってから本番化することでEC2/RDS費用の発生を最小化する

### フェーズB: CI/CDパイプライン（次のステップ）

**ブランチ**: `feature/phase-B-ci-cd`

- `.github/workflows/ci.yml` 新規作成（PRトリガー: 型チェック・Lint・単体テスト）
- `.github/workflows/nightly.yml` の `if: false` を削除して有効化
- `.github/workflows/deploy.yml` の枠だけ作成（Terraform後に中身を埋める）

### フェーズC: UI/UX改善

**ブランチ**: `feature/phase-C-ui-ux`

優先度順:
1. **Skeletonローダー** — メッセージ一覧読み込み中の表示（UX改善効果大）
2. **フォームUX改善** — エラー・成功状態のフィードバック強化
3. **shadcn/ui 導入** — Button・Input・Dialog をコンポーネントライブラリで統一
4. **メッセージアクションバー洗練** — ホバー時のアイコンボタン化
5. **framer-motion アニメーション** — フェードイン・スライド
6. **レスポンシブ対応** — モバイルでのサイドバー表示

### フェーズD: AWS + Terraform インフラ構築

AWS構成: EC2 t3.small + ALB + RDS db.t3.micro + S3 + ECR
（詳細は `C:\Users\miyan\.claude\plans\a-lint-e2e-steady-gosling.md` を参照）

- ドメインなし・HTTP運用でスタート（ALB DNS名: `xxxx.ap-northeast-1.elb.amazonaws.com`）
- ACM/Route53 はドメイン取得後に追加可能な構成にしておく
- Terraform state: S3 + DynamoDB（bootstrap手動1回のみ）
- GitHub Actions OIDC認証（アクセスキー不要）
- SSM Session Manager でEC2アクセス（SSH鍵不要）
