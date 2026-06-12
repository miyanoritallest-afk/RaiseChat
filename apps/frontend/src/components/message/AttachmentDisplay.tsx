'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Download } from 'lucide-react'
import type { MessageAttachment } from '@/types/message'

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        <div className="absolute top-2 right-2 flex gap-1.5">
          <a
            href={src}
            download={alt}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            title="ダウンロード"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            title="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

type Props = {
  attachments: MessageAttachment[]
}

export function AttachmentDisplay({ attachments }: Props) {
  const [lightboxSrc, setLightboxSrc] = useState<{ src: string; alt: string } | null>(null)

  if (attachments.length === 0) return null

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map((a) => (
          <div key={a.id} className="max-w-xs">
            {a.fileType === 'IMAGE' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.fileUrl}
                alt={a.fileName}
                className="rounded-lg max-h-64 object-contain border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxSrc({ src: a.fileUrl, alt: a.fileName })}
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

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc.src}
          alt={lightboxSrc.alt}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  )
}
