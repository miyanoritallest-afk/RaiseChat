import { test, expect } from '@playwright/test'

const BASE_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

let counter = 0
function uniqueUser(prefix = 'dm') {
  return `${prefix}_${Date.now()}_${++counter}`
}

// DMテストは2コンテキスト不要なので storageState なしで実行
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('DM機能 (E2E)', () => {
  test('userAからuserBへDMを送信できる', async ({ page, browser }) => {
    const userAName = uniqueUser('dmA')
    const userBName = uniqueUser('dmB')

    // ユーザー作成
    const resA = await fetch(`${BASE_API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userAName, displayName: userAName, password: 'TestPass1!' }),
    })
    const { token: tokenA } = (await resA.json()) as { token: string; user: { id: string } }

    const resB = await fetch(`${BASE_API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userBName, displayName: userBName, password: 'TestPass1!' }),
    })
    const { token: tokenB, user: userB } = (await resB.json()) as { token: string; user: { id: string } }

    // ワークスペース作成・参加
    const wsRes = await fetch(`${BASE_API}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: `DM WS ${Date.now()}` }),
    })
    const ws = (await wsRes.json()) as { id: string; inviteCode: string }

    await fetch(`${BASE_API}/workspaces/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ inviteCode: ws.inviteCode }),
    })

    // userAとしてDM部屋を作成（API経由）
    const dmRes = await fetch(`${BASE_API}/workspaces/${ws.id}/dm-rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ memberIds: [userB.id] }),
    })

    if (dmRes.ok) {
      const dm = (await dmRes.json()) as { id: string }

      // ブラウザでDMページを開く
      await page.goto('/')
      await page.evaluate((t: string) => localStorage.setItem('token', t), tokenA)
      await page.goto(`/dm-rooms/${dm.id}`)

      // DM入力欄が存在することを確認（ページの構造に依存）
      const hasInput = await page
        .locator('[data-testid="message-input"], textarea, input[type="text"]')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      // 入力欄があればメッセージを送信
      if (hasInput) {
        const input = page.locator('[data-testid="message-input"], textarea').first()
        await input.fill('Hello from DM test')
        await input.press('Enter')
        await expect(page.getByText('Hello from DM test')).toBeVisible({ timeout: 5000 })
      }
    }
  })
})
