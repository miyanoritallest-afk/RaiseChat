---
name: start-servers
description: Start the development server for TripDiary (Next.js dev server). Checks for port conflicts first and verifies startup before reporting. No Docker/PostgreSQL needed for prototype phase.
---

# start-servers

TripDiary の開発サーバー（Next.js）を起動する。プロトタイプフェーズでは DB 不要。

## 固定ポート設定

| サービス | ポート |
|---------|--------|
| Next.js  | 3000   |

**別ポートでの起動は禁止。**

## 実行ステップ

### 1. ポートの空きを確認・解放

```powershell
$conn = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 3000 }
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

### 2. Next.js 開発サーバーを起動（ポート 3000）

```bash
npm run dev
```

バックグラウンドで起動し、起動確認（最大30秒ポーリング）：
```powershell
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  try {
    $res = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2
    if ($res.StatusCode -eq 200) { $ready = $true; break }
  } catch {}
}
```

### 3. ブラウザを開く

```powershell
Start-Process "http://localhost:3000"
```

### 4. 結果レポート

```
## サービス起動状況

| サービス | ポート | 状態 |
|---------|--------|------|
| Next.js  | 3000   | ✅ 起動済み |
```

## ポート競合の解消

不明なプロセスがポート 3000 を占有している場合：
1. 特定: `Get-NetTCPConnection -LocalPort 3000 -State Listen`
2. 終了: `Stop-Process -Id <PID> -Force`
3. ポートが空いたことを確認してから起動

**代替ポートでの起動は絶対にしないこと。**

## 注意事項

- 許可プロンプトは自動で承認する（`defaultMode: dontAsk` 設定済み）
- DB実装フェーズに移行後は、PostgreSQL（ポート5432）も起動対象に追加する
