'use client'

import type { PendingAttachment } from '@/hooks/useFileUpload'

type Props = {
  attachments: PendingAttachment[]
  onRemove: (previewUrl: string) => void
}

export function FileAttachmentPreview({ attachments, onRemove }: Props) {
  if (attachments.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 pt-2">
      {attachments.map((a) => (
        <div
          key={a.previewUrl}
          className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center"
        >
          {a.file.type.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.previewUrl} alt={a.file.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 px-1">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs text-gray-500 truncate w-full text-center">
                {a.file.name}
              </span>
            </div>
          )}

          {/* アップロード中オーバーレイ */}
          {a.isUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* エラー表示 */}
          {a.error && (
            <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-1">
              <span className="text-white text-xs text-center leading-tight">{a.error}</span>
            </div>
          )}

          {/* 削除ボタン */}
          {!a.isUploading && (
            <button
              onClick={() => onRemove(a.previewUrl)}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-gray-800/70 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="削除"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
