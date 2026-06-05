'use client'

import { useState } from 'react'
import type { Message } from '@/types/message'
import { useAuthStore } from '@/stores/auth.store'
import { messageApi } from '@/lib/api/message.api'
import { useMessageStore } from '@/stores/message.store'

type Props = {
  message: Message
  wsId: string
  channelId: string
}

export function MessageItem({ message, wsId, channelId }: Props) {
  const { user } = useAuthStore()
  const { updateMessage, removeMessage } = useMessageStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAuthor = user?.id === message.user.id

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setIsEditing(false)
      return
    }
    setIsSubmitting(true)
    try {
      const updated = await messageApi.updateMessage(wsId, channelId, message.id, editContent)
      updateMessage(updated)
      setIsEditing(false)
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('このメッセージを削除しますか？')) return
    try {
      await messageApi.deleteMessage(wsId, channelId, message.id)
      removeMessage(message.id)
    } catch {
      // ignore
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="group flex gap-3 px-4 py-1 hover:bg-gray-50">
      <div className="w-9 h-9 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-sm font-medium text-gray-600 mt-0.5">
        {message.user.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm text-gray-900">{message.user.displayName}</span>
          <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
          {message.editedAt && <span className="text-xs text-gray-400">(編集済み)</span>}
        </div>

        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleEdit()
                }
                if (e.key === 'Escape') {
                  setIsEditing(false)
                  setEditContent(message.content)
                }
              }}
              className="w-full px-3 py-2 border border-blue-400 rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={2}
              autoFocus
            />
            <div className="flex gap-2 mt-1 text-xs">
              <button
                onClick={() => void handleEdit()}
                disabled={isSubmitting}
                className="text-blue-600 hover:underline"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditContent(message.content)
                }}
                className="text-gray-500 hover:underline"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </div>

      {isAuthor && !isEditing && (
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            編集
          </button>
          <button
            onClick={() => void handleDelete()}
            className="px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
          >
            削除
          </button>
        </div>
      )}
    </div>
  )
}
