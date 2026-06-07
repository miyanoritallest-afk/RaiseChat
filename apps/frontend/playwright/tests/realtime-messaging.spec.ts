import { test, expect, Browser, BrowserContext, Page } from '@playwright/test'

const BASE_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

let counter = 0
function uniqueUser(prefix = 'rt') {
  return `${prefix}_${Date.now()}_${++counter}`
}

async function setupAuthenticatedUser(
  browser: Browser,
  username: string,
): Promise<{ context: BrowserContext; page: Page; token: string; userId: string }> {
  const res = await fetch(`${BASE_API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, displayName: username, password: 'TestPass1!' }),
  })
  const data = (await res.json()) as { token: string; user: { id: string } }

  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('/')
  await page.evaluate((t: string) => localStorage.setItem('token', t), data.token)

  return { context, page, token: data.token, userId: data.user.id }
}

/**
 * リアルタイムメッセージングのE2Eテスト
 * 2ブラウザコンテキストを使ってSocket.ioのリアルタイム通信を検証する
 *
 * 実行方法: npx playwright test realtime-messaging --project=realtime
 */
test.describe('リアルタイムメッセージング (2コンテキスト)', () => {
  test('userAが送信したメッセージがuserBの画面にリアルタイムで表示される', async ({
    browser,
  }) => {
    const userAName = uniqueUser('userA')
    const userBName = uniqueUser('userB')

    const userA = await setupAuthenticatedUser(browser, userAName)
    const userB = await setupAuthenticatedUser(browser, userBName)

    // ワークスペース作成（userA）
    const wsRes = await fetch(`${BASE_API}/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.token}`,
      },
      body: JSON.stringify({ name: `RT Workspace ${Date.now()}` }),
    })
    const ws = (await wsRes.json()) as { id: string; inviteCode: string }

    // userBがワークスペースに参加
    await fetch(`${BASE_API}/workspaces/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userB.token}`,
      },
      body: JSON.stringify({ inviteCode: ws.inviteCode }),
    })

    // 両ユーザーがgeneralチャンネルを開く
    await userA.page.goto(`/workspaces/${ws.id}`)
    await userB.page.goto(`/workspaces/${ws.id}`)

    // チャンネルが表示されるまで待機
    await userA.page.waitForSelector('[data-testid="message-input"], textarea, input[placeholder]', {
      timeout: 10000,
    })

    const uniqueMessage = `Hello from A at ${Date.now()}`

    // userAがメッセージ送信
    const inputA = userA.page
      .locator('[data-testid="message-input"], textarea')
      .first()
    await inputA.fill(uniqueMessage)
    await inputA.press('Enter')

    // userBの画面でメッセージが表示されるのを待機（リアルタイム検証）
    await expect(userB.page.getByText(uniqueMessage)).toBeVisible({ timeout: 8000 })

    await userA.context.close()
    await userB.context.close()
  })

  test('userAがメッセージを削除するとuserBの画面から消える', async ({ browser }) => {
    const userAName = uniqueUser('delA')
    const userBName = uniqueUser('delB')

    const userA = await setupAuthenticatedUser(browser, userAName)
    const userB = await setupAuthenticatedUser(browser, userBName)

    const wsRes = await fetch(`${BASE_API}/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userA.token}`,
      },
      body: JSON.stringify({ name: `Del Workspace ${Date.now()}` }),
    })
    const ws = (await wsRes.json()) as { id: string; inviteCode: string }

    await fetch(`${BASE_API}/workspaces/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userB.token}`,
      },
      body: JSON.stringify({ inviteCode: ws.inviteCode }),
    })

    await userA.page.goto(`/workspaces/${ws.id}`)
    await userB.page.goto(`/workspaces/${ws.id}`)

    await userA.page.waitForSelector('[data-testid="message-input"], textarea', { timeout: 10000 })

    const uniqueMessage = `Delete me ${Date.now()}`
    const inputA = userA.page.locator('[data-testid="message-input"], textarea').first()
    await inputA.fill(uniqueMessage)
    await inputA.press('Enter')

    // userBの画面でメッセージが表示されるを待機
    await expect(userB.page.getByText(uniqueMessage)).toBeVisible({ timeout: 8000 })

    // userAがメッセージをホバーして削除ボタンをクリック
    const messageEl = userA.page.getByText(uniqueMessage)
    await messageEl.hover()
    const deleteBtn = userA.page.getByRole('button', { name: /削除/ }).first()
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click()
      // 確認ダイアログがある場合
      const confirmBtn = userA.page.getByRole('button', { name: /確認|OK|はい/ }).first()
      if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmBtn.click()
      }

      // userBの画面からメッセージが消えるのを待機
      await expect(userB.page.getByText(uniqueMessage)).not.toBeVisible({ timeout: 8000 })
    }

    await userA.context.close()
    await userB.context.close()
  })
})
