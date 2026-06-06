'use client'

import type { MessageAttachment } from '@/types/message'

type Props = {
  attachments: MessageAttachment[]
}

export function AttachmentDisplay({ attachments }: Props) {
  if (attachments.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map((a) => (
        <div key={a.id} className="max-w-xs">
          {a.fileType === 'IMAGE' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={a.fileUrl}
              alt={a.fileName}
              className="rounded-lg max-h-64 object-contain border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(a.fileUrl, '_blank')}
            />
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={a.fileUrl}
              controls
              className="rounded-lg max-h-64 max-w-xs border border-gray-200"
            />
          )}
          <p className="text-xs text-gray-400 mt-0.5 truncate">{a.fileName}</p>
        </div>
      ))}
    </div>
  )
}
