'use client'

import { useRef, useState } from 'react'
import { useMessageStore } from '@/stores/message.store'
import { messageApi } from '@/lib/api/message.api'

type Props = {
  wsId: string
  channelId: string
  channelName: string
}

export function MessageInput({ wsId, channelId, channelName }: Props) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addMessage } = useMessageStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed || isSubmitting) return

    setIsSubmitting(true)
    try {
      const message = await messageApi.createMessage(wsId, channelId, { content: trimmed })
      addMessage(message)
      setContent('')
      textareaRef.current?.focus()
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex items-end gap-2 border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`#${channelName} にメッセージを送信`}
          rows={1}
          className="flex-1 resize-none text-sm text-gray-900 placeholder-gray-400 focus:outline-none max-h-40"
          style={{ minHeight: '24px' }}
        />
        <button
          onClick={() => void handleSubmit()}
          disabled={!content.trim() || isSubmitting}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded transition-colors"
        >
          送信
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1">Enter で送信、Shift+Enter で改行</p>
    </div>
  )
}
