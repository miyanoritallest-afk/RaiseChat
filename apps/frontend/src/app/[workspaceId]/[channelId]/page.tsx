'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { MessageList } from '@/components/message/MessageList'
import { MessageInput } from '@/components/message/MessageInput'
import { TypingIndicator } from '@/components/message/TypingIndicator'
import { ThreadPanel } from '@/components/thread/ThreadPanel'
import { useChannelStore } from '@/stores/channel.store'
import { useMessageStore } from '@/stores/message.store'
import { useThreadStore } from '@/stores/thread.store'
import { usePinStore } from '@/stores/pin.store'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { notificationApi } from '@/lib/api/notification.api'
import { useSocket } from '@/hooks/useSocket'
import { PinToggleButton, PinnedMessagesPanel } from '@/components/channel/PinnedMessagesPanel'

export default function ChannelPage() {
  const params = useParams<{ workspaceId: string; channelId: string }>()
  const { channels, currentChannel, setCurrentChannel } = useChannelStore()
  const { reset: resetMessages } = useMessageStore()
  const { isOpen: isThreadOpen, reset: resetThread } = useThreadStore()
  const { reset: resetPins } = usePinStore()
  const { user } = useAuthStore()
  const { markReadForChannel } = useNotificationStore()
  const channel = channels.find((ch) => ch.id === params.channelId) ?? null
  const socket = useSocket(params.channelId, params.workspaceId)

  // チャンネルが見つかったら currentChannel を更新（ヘッダー楽観的表示に使う）
  useEffect(() => {
    if (channel) setCurrentChannel(channel)
  }, [channel, setCurrentChannel])

  // チャンネル切り替え時はメッセージ・スレッド・ピンの状態をリセット
  useEffect(() => {
    resetMessages()
    resetThread()
    resetPins()
  }, [params.channelId, resetMessages, resetThread, resetPins])

  // チャンネルを開いたら関連通知を既読にして太字を解除
  useEffect(() => {
    markReadForChannel(params.channelId)
    void notificationApi.markReadByChannel(params.channelId).catch(() => {})
  }, [params.channelId, markReadForChannel])

  return (
    <AppLayout workspaceId={params.workspaceId}>
      <div className="flex h-full overflow-hidden">
        {/* メインチャット領域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
            <span className="text-gray-500">#</span>
            {(channel ?? currentChannel) ? (
              <span className="font-semibold text-gray-900">
                {(channel ?? currentChannel)!.name}
              </span>
            ) : (
              <span className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            )}
            <div className="ml-auto">
              <PinToggleButton />
            </div>
          </div>
          <MessageList wsId={params.workspaceId} channelId={params.channelId} />
          {user && (
            <TypingIndicator socket={socket} channelId={params.channelId} currentUserId={user.id} />
          )}
          <MessageInput
            wsId={params.workspaceId}
            channelId={params.channelId}
            channelName={(channel ?? currentChannel)?.name ?? ''}
            socket={socket}
          />
        </div>

        {/* スレッドパネル（返信ボタンを押したときに右側に表示） */}
        {isThreadOpen && (
          <ThreadPanel wsId={params.workspaceId} channelId={params.channelId} socket={socket} />
        )}

        {/* ピン留めパネル（ピンアイコンを押したときに右側に表示） */}
        <PinnedMessagesPanel wsId={params.workspaceId} channelId={params.channelId} />
      </div>
    </AppLayout>
  )
}
