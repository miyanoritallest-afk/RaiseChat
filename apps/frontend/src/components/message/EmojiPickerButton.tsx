'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// SSR を無効にして emoji-mart をロード（ブラウザ専用ライブラリ）
const EmojiPicker = dynamic(() => import('@emoji-mart/react'), { ssr: false })

type Props = {
  onSelect: (emoji: string) => void
}

export function EmojiPickerButton({ onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // ピッカー外クリックで閉じる
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleEmojiSelect = (data: { native: string }) => {
    onSelect(data.native)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        title="リアクションを追加"
        aria-label="リアクションを追加"
      >
        😊
      </button>
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-1 z-50 shadow-lg">
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            locale="ja"
            previewPosition="none"
            skinTonePosition="none"
          />
        </div>
      )}
    </div>
  )
}
