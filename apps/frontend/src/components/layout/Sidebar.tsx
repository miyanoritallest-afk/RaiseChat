'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useChannelStore } from '@/stores/channel.store'

export function Sidebar() {
  const params = useParams<{ workspaceId: string; channelId: string }>()
  const { channels } = useChannelStore()

  return (
    <aside className="w-60 bg-gray-800 text-gray-300 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-700">
        <span className="text-sm font-semibold text-white">チャンネル</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {channels.map((ch) => (
          <Link
            key={ch.id}
            href={`/${params.workspaceId}/${ch.id}`}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm hover:bg-gray-700 transition-colors ${
              params.channelId === ch.id ? 'bg-gray-600 text-white' : 'text-gray-400'
            }`}
          >
            <span className="text-gray-500">#</span>
            {ch.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
