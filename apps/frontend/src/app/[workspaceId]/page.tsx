'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { useChannelStore } from '@/stores/channel.store'

export default function WorkspacePage() {
  const params = useParams<{ workspaceId: string }>()
  const router = useRouter()
  const { channels } = useChannelStore()

  useEffect(() => {
    if (channels.length > 0) {
      const defaultChannel = channels.find((ch) => ch.isDefault) ?? channels[0]
      router.replace(`/${params.workspaceId}/${defaultChannel.id}`)
    }
  }, [channels, params.workspaceId, router])

  return (
    <AppLayout workspaceId={params.workspaceId}>
      <div className="flex-1 flex items-center justify-center text-gray-400">
        チャンネルを選択してください
      </div>
    </AppLayout>
  )
}
