import { test, expect, Browser, BrowserContext, Page } from '@playwright/test'

const BASE_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

let counter = 0
function uniqueUser(prefix = 'rt') {
  const ts = String(Date.now()).slice(-5)
  return `${prefix}${ts}${++counter}`
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
  if (!res.ok) {
    throw new Error(`Failed to register user ${username}: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as { token: string; user: { id: string } }

  const context = await browser.newContext()
  const page = await context.newPage()
  // まずlocalStorageにトークンをセットしてからページ遷移
  // (Socket.ioはgetSocket()初回呼び出し時にlocalStorageからトークンを読む)
  await page.goto('/')
  await page.evaluate((t: string) => localStorage.setItem('token', t), data.token)
  await page.reload()
  // ページのDOMが安定するまで待機（AuthInitializerのgetMe完了を想定）
  await page.waitForLoadState('networkidle', { timeout: 10000 })

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
    await userA.page.goto(`/${ws.id}`)
    await userB.page.goto(`/${ws.id}`)

    // 両ユーザーがチャンネルページ（入力欄）に到達するまで待機
    await userA.page.waitForSelector('[data-testid="message-input"], textarea', { timeout: 15000 })
    await userB.page.waitForSelector('[data-testid="message-input"], textarea', { timeout: 15000 })

    // Socket.io接続の安定を待つ
    await userA.page.waitForTimeout(1000)

    const uniqueMessage = `Hello from A at ${Date.now()}`

    // userAがメッセージ送信
    const inputA = userA.page.locator('[data-testid="message-input"], textarea').first()
    await inputA.fill(uniqueMessage)
    await inputA.press('Enter')

    // userBの画面でメッセージが表示されるのを待機（リアルタイム検証）
    await expect(userB.page.getByText(uniqueMessage)).toBeVisible({ timeout: 10000 })

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

    // generalチャンネルIDを取得
    const chRes = await fetch(`${BASE_API}/workspaces/${ws.id}/channels`, {
      headers: { Authorization: `Bearer ${userA.token}` },
    })
    const channels = (await chRes.json()) as Array<{ id: string; name: string }>
    const general = channels.find((c) => c.name === 'general') ?? channels[0]

    await userA.page.goto(`/${ws.id}`)
    await userB.page.goto(`/${ws.id}`)

    // 両ユーザーがチャンネルページに到達するまで待機
    await userA.page.waitForSelector('[data-testid="message-input"], textarea', { timeout: 15000 })
    await userB.page.waitForSelector('[data-testid="message-input"], textarea', { timeout: 15000 })

    // Socket.io接続の安定を待つ
    await userA.page.waitForTimeout(1500)

    const uniqueMessage = `Delete me ${Date.now()}`
    const inputA = userA.page.locator('[data-testid="message-input"], textarea').first()
    await inputA.fill(uniqueMessage)
    await inputA.press('Enter')

    // 両ユーザーの画面でメッセージが表示されるを待機
    await expect(userA.page.getByText(uniqueMessage)).toBeVisible({ timeout: 10000 })
    await expect(userB.page.getByText(uniqueMessage)).toBeVisible({ timeout: 10000 })

    // UIから削除ボタンをクリック（メッセージにホバーして削除ボタンを表示）
    const messageEl = userA.page.getByText(uniqueMessage)
    await messageEl.hover()
    const deleteBtn = userA.page.locator('[data-testid="delete-message-btn"]').first()
    await expect(deleteBtn).toBeVisible({ timeout: 3000 })
    await deleteBtn.click({ force: true })

    // userAの画面でメッセージが消えることを確認（削除完了の証明）
    await expect(userA.page.getByText(uniqueMessage)).not.toBeVisible({ timeout: 8000 })

    // userBの画面からメッセージが消えるのを待機（Socket.ioリアルタイム反映）
    await expect(userB.page.getByText(uniqueMessage)).not.toBeVisible({ timeout: 10000 })

    await userA.context.close()
    await userB.context.close()
  })
})
