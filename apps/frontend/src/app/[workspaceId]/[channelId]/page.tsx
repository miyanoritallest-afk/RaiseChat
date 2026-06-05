'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { MessageList } from '@/components/message/MessageList'
import { MessageInput } from '@/components/message/MessageInput'
import { TypingIndicator } from '@/components/message/TypingIndicator'
import { useChannelStore } from '@/stores/channel.store'
import { useMessageStore } from '@/stores/message.store'
import { useAuthStore } from '@/stores/auth.store'
import { useSocket } from '@/hooks/useSocket'

export default function ChannelPage() {
  const params = useParams<{ workspaceId: string; channelId: string }>()
  const { channels } = useChannelStore()
  const { reset } = useMessageStore()
  const { user } = useAuthStore()
  const channel = channels.find((ch) => ch.id === params.channelId)
  const socket = useSocket(params.channelId, params.workspaceId)

  useEffect(() => {
    reset()
  }, [params.channelId, reset])

  return (
    <AppLayout workspaceId={params.workspaceId}>
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
          <span className="text-gray-500">#</span>
          <span className="font-semibold text-gray-900">{channel?.name ?? '...'}</span>
        </div>
        <MessageList wsId={params.workspaceId} channelId={params.channelId} />
        {user && (
          <TypingIndicator socket={socket} channelId={params.channelId} currentUserId={user.id} />
        )}
        <MessageInput
          wsId={params.workspaceId}
          channelId={params.channelId}
          channelName={channel?.name ?? ''}
          socket={socket}
        />
      </div>
    </AppLayout>
  )
}
