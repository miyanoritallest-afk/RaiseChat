'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="ja">
      <body className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">致命的なエラーが発生しました</h2>
          <p className="text-sm text-gray-500">ページを再読み込みしてください。</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
          >
            再試行
          </button>
        </div>
      </body>
    </html>
  )
}
