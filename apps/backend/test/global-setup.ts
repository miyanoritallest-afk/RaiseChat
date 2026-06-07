import { execSync } from 'child_process'
import * as dotenv from 'dotenv'
import * as path from 'path'

export default function globalSetup() {
  dotenv.config({ path: path.resolve(__dirname, '../.env.test') })

  const cwd = path.resolve(__dirname, '..')
  const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL }

  // テスト用DBにスキーマを強制適用してクリーンな状態にする
  execSync('npx prisma db push --force-reset --schema ../../prisma/schema.prisma', {
    cwd,
    env,
    stdio: 'inherit',
  })
}
