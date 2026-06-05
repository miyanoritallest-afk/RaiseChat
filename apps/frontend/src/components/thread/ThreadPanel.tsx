'use client'

import type { Socket } from 'socket.io-client'
import { ThreadHeader } from './ThreadHeader'
import { ThreadMessageList } from './ThreadMessageList'
import { ThreadMessageInput } from './ThreadMessageInput'
import { useThread } from '@/hooks/useThread'

type Props = {
  wsId: string
  channelId: string
  socket: Socket
}

export function ThreadPanel({ wsId, channelId, socket }: Props) {
  const { isLoading, hasMore, loadMore } = useThread(wsId, channelId)

  return (
    <div className="w-80 flex-shrink-0 border-l border-gray-200 flex flex-col bg-white">
      <ThreadHeader />
      <ThreadMessageList
        wsId={wsId}
        channelId={channelId}
        hasMore={hasMore}
        isLoading={isLoading}
        loadMore={loadMore}
      />
      <ThreadMessageInput channelId={channelId} socket={socket} />
    </div>
  )
}
