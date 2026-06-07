import { execSync } from 'child_process'
import * as dotenv from 'dotenv'
import * as path from 'path'

export default function globalSetup() {
  dotenv.config({ path: path.resolve(__dirname, '../.env.test') })

  // テスト用DBをクリーンな状態にリセット
  execSync('npx prisma migrate reset --force --skip-seed --schema ../../prisma/schema.prisma', {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
    stdio: 'inherit',
  })
}
