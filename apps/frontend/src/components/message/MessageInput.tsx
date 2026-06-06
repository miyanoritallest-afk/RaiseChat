'use client'

import { useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { useTyping } from '@/hooks/useTyping'
import { useFileUpload } from '@/hooks/useFileUpload'
import { FileAttachmentPreview } from './FileAttachmentPreview'

type Props = {
  wsId: string
  channelId: string
  channelName: string
  socket: Socket
}

const ACCEPTED_MIME = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm'

export function MessageInput({ wsId, channelId, channelName, socket }: Props) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { startTyping, stopTyping } = useTyping(socket, channelId)
  const {
    attachments,
    addFile,
    removeFile,
    reset: resetAttachments,
    readyAttachments,
  } = useFileUpload(wsId)

  const isUploading = attachments.some((a) => a.isUploading)

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if ((!trimmed && readyAttachments.length === 0) || isSubmitting || isUploading) return

    setIsSubmitting(true)
    stopTyping()
    try {
      socket.emit('message:send', {
        channelId,
        content: trimmed || ' ', // 添付のみの場合はスペース1文字を送る
        attachments: readyAttachments.length > 0 ? readyAttachments : undefined,
      })
      setContent('')
      resetAttachments()
      textareaRef.current?.focus()
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      await addFile(file)
    }
    // 同じファイルを再選択できるようにリセット
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="px-4 pb-4">
      <FileAttachmentPreview attachments={attachments} onRemove={removeFile} />
      <div className="flex items-end gap-2 border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 mt-1">
        {/* クリップアイコン（ファイル添付） */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          title="ファイルを添付"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_MIME}
          multiple
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            startTyping()
          }}
          onKeyDown={handleKeyDown}
          onBlur={stopTyping}
          placeholder={`#${channelName} にメッセージを送信`}
          rows={1}
          className="flex-1 resize-none text-sm text-gray-900 placeholder-gray-400 focus:outline-none max-h-40"
          style={{ minHeight: '24px' }}
        />
        <button
          onClick={() => void handleSubmit()}
          disabled={
            (!content.trim() && readyAttachments.length === 0) || isSubmitting || isUploading
          }
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded transition-colors"
        >
          {isUploading ? '...' : '送信'}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1">Enter で送信、Shift+Enter で改行</p>
    </div>
  )
}
