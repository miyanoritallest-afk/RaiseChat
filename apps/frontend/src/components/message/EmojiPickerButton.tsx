'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'

const EmojiPicker = dynamic(() => import('@emoji-mart/react'), { ssr: false })

type Props = {
  onSelect: (emoji: string) => void
}

export function EmojiPickerButton({ onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [pickerStyle, setPickerStyle] = useState<React.CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleOpen = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    // ピッカーの高さ約435px — 上に収まる余地があれば上に、なければ下に表示
    const spaceAbove = rect.top
    const showAbove = spaceAbove > 440
    setPickerStyle({
      position: 'fixed',
      zIndex: 9999,
      right: Math.max(8, window.innerWidth - rect.right),
      ...(showAbove ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    })
    setIsOpen((prev) => !prev)
  }

  const handleEmojiSelect = (data: { native: string }) => {
    onSelect(data.native)
    setIsOpen(false)
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        title="リアクションを追加"
        aria-label="リアクションを追加"
      >
        😊
      </button>
      {isOpen &&
        createPortal(
          <div ref={pickerRef} style={pickerStyle} className="shadow-xl">
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              locale="ja"
              previewPosition="none"
              skinTonePosition="none"
            />
          </div>,
          document.body,
        )}
    </>
  )
}
