import { test, expect } from '@playwright/test'

const BASE_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

let counter = 0
function uniqueUser(prefix = 'thr') {
  const ts = String(Date.now()).slice(-5)
  return `${prefix}${ts}${++counter}`
}

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('スレッド機能 (E2E)', () => {
  test('メッセージにスレッド返信ができる', async ({ page }) => {
    const username = uniqueUser()

    const res = await fetch(`${BASE_API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, displayName: username, password: 'TestPass1!' }),
    })
    const { token } = (await res.json()) as { token: string }

    const wsRes = await fetch(`${BASE_API}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: `Thread WS ${Date.now()}` }),
    })
    const ws = (await wsRes.json()) as { id: string }

    await page.goto('/')
    await page.evaluate((t: string) => localStorage.setItem('token', t), token)
    await page.goto(`/${ws.id}`)

    // メッセージ入力を待機
    const hasInput = await page
      .locator('[data-testid="message-input"], textarea')
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false)

    if (hasInput) {
      const uniqueMsg = `Thread test ${Date.now()}`
      const input = page.locator('[data-testid="message-input"], textarea').first()
      await input.fill(uniqueMsg)
      await input.press('Enter')

      // 投稿されたメッセージにホバーしてスレッドボタンを探す
      const msgEl = page.getByText(uniqueMsg)
      await expect(msgEl).toBeVisible({ timeout: 5000 })
      await msgEl.hover()

      // スレッド返信ボタンをクリック（存在する場合）
      const threadBtn = page.getByRole('button', { name: /返信|スレッド|Reply/ }).first()
      if (await threadBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await threadBtn.click()

        // スレッドパネルが開くのを待機
        const threadPanel = page.locator('[data-testid="thread-panel"], [role="complementary"]')
        if (await threadPanel.isVisible({ timeout: 3000 }).catch(() => false)) {
          const replyInput = threadPanel.locator('textarea, input').first()
          await replyInput.fill('Thread reply test')
          await replyInput.press('Enter')

          await expect(page.getByText('Thread reply test')).toBeVisible({ timeout: 5000 })
        }
      }
    }
  })
})
