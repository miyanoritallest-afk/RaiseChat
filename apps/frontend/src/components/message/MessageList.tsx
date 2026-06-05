'use client'

import { useEffect, useRef } from 'react'
import { useMessageStore } from '@/stores/message.store'
import { MessageItem } from './MessageItem'
import { useMessages } from '@/hooks/useMessages'

type Props = {
  wsId: string
  channelId: string
}

export function MessageList({ wsId, channelId }: Props) {
  const { messages, hasMore, isLoading } = useMessageStore()
  const { loadMore } = useMessages(wsId, channelId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevChannelRef = useRef<string | null>(null)
  // 新着メッセージのIDを追跡（配列先頭 = 最新）
  const newestMessageId = messages[0]?.id

  useEffect(() => {
    if (prevChannelRef.current !== channelId) {
      prevChannelRef.current = channelId
      bottomRef.current?.scrollIntoView()
    }
  }, [channelId])

  // newestMessageId が変わった = 新着メッセージ追加時のみ下スクロール
  // loadMore による過去メッセージ追加では先頭IDは変わらないためスクロールしない
  useEffect(() => {
    if (!newestMessageId) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [newestMessageId])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && hasMore && !isLoading) {
      void loadMore()
    }
  }

  return (
    <div className="flex-1 overflow-y-auto py-4" onScroll={handleScroll}>
      {isLoading && <div className="text-center text-xs text-gray-400 py-2">読み込み中...</div>}
      {hasMore && !isLoading && (
        <div className="text-center text-xs text-gray-400 py-2">
          上にスクロールして過去のメッセージを表示
        </div>
      )}

      {[...messages].reverse().map((message) => (
        <MessageItem key={message.id} message={message} wsId={wsId} channelId={channelId} />
      ))}

      <div ref={bottomRef} />
    </div>
  )
}
