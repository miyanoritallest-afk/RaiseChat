'use client'

import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { useChannelStore } from '@/stores/channel.store'

export default function ChannelPage() {
  const params = useParams<{ workspaceId: string; channelId: string }>()
  const { channels } = useChannelStore()
  const channel = channels.find((ch) => ch.id === params.channelId)

  return (
    <AppLayout workspaceId={params.workspaceId}>
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <span className="text-gray-500">#</span>
          <span className="font-semibold text-gray-900">{channel?.name ?? '...'}</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400">
          メッセージ機能は Sprint 4 で実装予定
        </div>
      </div>
    </AppLayout>
  )
}
