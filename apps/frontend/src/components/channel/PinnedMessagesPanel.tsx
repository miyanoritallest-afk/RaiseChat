'use client'

import { useEffect } from 'react'
import { usePinStore } from '@/stores/pin.store'
import { useThreadStore } from '@/stores/thread.store'
import { pinApi } from '@/lib/api/pin.api'
import { usePins } from '@/hooks/usePins'
import { PinnedMessageItem } from './PinnedMessageItem'
import type { Message } from '@/types/message'

type Props = {
  wsId: string
  channelId: string
}

/** チャンネルヘッダーに配置するトグルボタン */
export function PinToggleButton() {
  const { pins, isPanelOpen, togglePanel } = usePinStore()

  return (
    <button
      onClick={togglePanel}
      className={`flex items-center gap-1 px-2 py-1 text-sm rounded transition-colors ${
        isPanelOpen
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
      title="ピン留めメッセージ"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {pins.length > 0 && <span className="text-xs">{pins.length}</span>}
    </button>
  )
}

/** 右サイドパネル本体 */
export function PinnedMessagesPanel({ wsId, channelId }: Props) {
  const { pins, setPins, isPanelOpen, togglePanel } = usePinStore()
  const { unpin } = usePins(channelId)
  const { openThread } = useThreadStore()

  const handleJumpToThread = (messageId: string) => {
    const pin = pins.find((p) => p.messageId === messageId)
    if (!pin) return
    const message: Message = {
      id: pin.message.id,
      content: pin.message.content,
      channelId,
      threadId: null,
      editedAt: null,
      createdAt: pin.message.createdAt,
      user: {
        id: pin.message.user.id,
        username: pin.message.user.displayName,
        displayName: pin.message.user.displayName,
        avatarUrl: pin.message.user.avatarUrl,
        status: 'OFFLINE',
      },
      attachments: [],
      reactions: [],
      _count: { replies: 0 },
      replies: [],
    }
    openThread(message)
    togglePanel()
  }

  useEffect(() => {
    if (!isPanelOpen) return
    pinApi
      .getPins(wsId, channelId)
      .then(setPins)
      .catch(() => {})
  }, [isPanelOpen, wsId, channelId, setPins])

  if (!isPanelOpen) return null

  return (
    <div className="flex-shrink-0 w-72 border-l border-gray-200 flex flex-col bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <h2 className="font-semibold text-sm text-gray-900">
          ピン留め {pins.length > 0 && <span className="text-gray-400">({pins.length})</span>}
        </h2>
        <button
          onClick={togglePanel}
          className="text-gray-400 hover:text-gray-600"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {pins.length === 0 ? (
          <p className="px-4 py-8 text-sm text-gray-400 text-center">
            ピン留めされたメッセージはありません
          </p>
        ) : (
          pins.map((pin) => (
            <PinnedMessageItem
              key={pin.id}
              pin={pin}
              onUnpin={unpin}
              onJumpToThread={handleJumpToThread}
            />
          ))
        )}
      </div>
    </div>
  )
}
