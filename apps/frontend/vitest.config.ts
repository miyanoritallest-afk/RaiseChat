import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/playwright/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      include: ['src/stores/**', 'src/hooks/**'],
      thresholds: {
        lines: 60,
        functions: 60,
      },
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
})
