import { test as setup, expect } from '@playwright/test'

const BASE_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

let counter = 0
function uniqueUser(prefix = 'pw') {
  return `${prefix}_${Date.now()}_${++counter}`
}

async function registerUser(username: string): Promise<string> {
  const res = await fetch(`${BASE_API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, displayName: username, password: 'TestPass1!' }),
  })
  const data = (await res.json()) as { token: string }
  return data.token
}

setup('create userA auth state', async ({ page }) => {
  const username = uniqueUser('userA')
  const token = await registerUser(username)

  // LocalStorage にトークンをセットして storageState に保存
  await page.goto('/')
  await page.evaluate((t: string) => localStorage.setItem('token', t), token)

  await page.context().storageState({ path: 'playwright/.auth/userA.json' })
})

setup('create userB auth state', async ({ page }) => {
  const username = uniqueUser('userB')
  const token = await registerUser(username)

  await page.goto('/')
  await page.evaluate((t: string) => localStorage.setItem('token', t), token)

  await page.context().storageState({ path: 'playwright/.auth/userB.json' })
})
