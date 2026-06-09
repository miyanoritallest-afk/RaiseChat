'use client'

import { useRef, useState, useEffect } from 'react'
import type { Socket } from 'socket.io-client'
import { useThreadStore } from '@/stores/thread.store'

type Props = {
  channelId: string
  socket: Socket
}

export function ThreadMessageInput({ channelId, socket }: Props) {
  const { parentMessage } = useThreadStore()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed || isSubmitting || !parentMessage) return

    setIsSubmitting(true)
    try {
      socket.emit('message:send', {
        channelId,
        content: trimmed,
        threadId: parentMessage.id,
      })
      setContent('')
      textareaRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [content])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div className="px-4 pb-4 pt-2 border-t border-gray-200">
      <div className="flex items-end gap-2 border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="スレッドに返信する"
          rows={1}
          className="flex-1 resize-none text-sm text-gray-900 placeholder-gray-400 focus:outline-none max-h-40"
          style={{ minHeight: '24px', height: '24px' }}
        />
        <button
          onClick={() => void handleSubmit()}
          disabled={!content.trim() || isSubmitting}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded transition-colors"
        >
          返信
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1">Enter で返信、Shift+Enter で改行</p>
    </div>
  )
}
