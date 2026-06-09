'use client'

import { useState, useEffect, useRef as useEditRef } from 'react'
import { motion } from 'framer-motion'
import type { Message } from '@/types/message'
import { useAuthStore } from '@/stores/auth.store'
import { messageApi } from '@/lib/api/message.api'
import { useMessageStore } from '@/stores/message.store'
import { getSocket } from '@/lib/socket/socket.client'
import { useThreadStore } from '@/stores/thread.store'
import { useReaction } from '@/hooks/useReaction'
import { usePins } from '@/hooks/usePins'
import { usePinStore } from '@/stores/pin.store'
import { Pin, PinOff, MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { ReactionBar } from './ReactionBar'
import { EmojiPickerButton } from './EmojiPickerButton'
import { AttachmentDisplay } from './AttachmentDisplay'

type Props = {
  message: Message
  wsId: string
  channelId: string
}

export function MessageItem({ message, wsId, channelId }: Props) {
  const { user } = useAuthStore()
  const { updateMessage, removeMessage } = useMessageStore()
  const { openThread } = useThreadStore()
  const { toggle: toggleReaction } = useReaction(channelId)
  const { pin, unpin } = usePins(channelId)
  const pins = usePinStore((s) => s.pins)
  const isPinned = pins.some((p) => p.messageId === message.id)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAuthor = user?.id === message.user.id
  const hasReplies = message._count.replies > 0
  const editTextareaRef = useEditRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = editTextareaRef.current
    if (!el || !isEditing) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [editContent, isEditing])

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
    try {
      await messageApi.deleteMessage(wsId, channelId, message.id)
      // Socket.ioで全チャンネルメンバーに削除を通知
      getSocket().emit('message:delete', { messageId: message.id, channelId })
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="group flex gap-3 px-4 py-2 hover:bg-gray-50"
    >
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
              ref={editTextareaRef}
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
              style={{ minHeight: '40px', height: '40px' }}
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

        {/* 添付ファイル */}
        {!isEditing && message.attachments.length > 0 && (
          <AttachmentDisplay attachments={message.attachments} />
        )}

        {/* リアクション */}
        {!isEditing && (
          <ReactionBar
            reactions={message.reactions}
            onToggle={(emoji) => toggleReaction(message.id, emoji)}
          />
        )}

        {/* 返信数とアバター（返信がある場合のみ表示） */}
        {hasReplies && !isEditing && (
          <button
            onClick={() => openThread(message)}
            className="mt-1.5 flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
          >
            <div className="flex -space-x-1">
              {message.replies.slice(0, 3).map((r) => (
                <div
                  key={r.user.id}
                  className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs border border-white"
                  title={r.user.displayName}
                >
                  {r.user.displayName.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span>{message._count.replies} 件の返信</span>
          </button>
        )}
      </div>

      {!isEditing && (
        <TooltipProvider>
          <div className="hidden group-hover:flex items-center gap-0.5 self-start mt-1">
            <EmojiPickerButton onSelect={(emoji) => toggleReaction(message.id, emoji)} />
            <Tooltip>
              <TooltipTrigger
                onClick={() => (isPinned ? unpin(message.id) : pin(message.id))}
                className={`p-1.5 rounded hover:bg-gray-100 ${
                  isPinned
                    ? 'text-yellow-600 hover:text-yellow-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </TooltipTrigger>
              <TooltipContent>{isPinned ? 'ピン留めを解除' : 'ピン留め'}</TooltipContent>
            </Tooltip>
            {!hasReplies && (
              <Tooltip>
                <TooltipTrigger
                  onClick={() => openThread(message)}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </TooltipTrigger>
                <TooltipContent>返信</TooltipContent>
              </Tooltip>
            )}
            {isAuthor && (
              <>
                <Tooltip>
                  <TooltipTrigger
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>編集</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    data-testid="delete-message-btn"
                    onClick={() => void handleDelete()}
                    className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>削除</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </TooltipProvider>
      )}
    </motion.div>
  )
}
