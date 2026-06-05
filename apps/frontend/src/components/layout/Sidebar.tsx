'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useChannelStore } from '@/stores/channel.store'
import { useDmStore } from '@/stores/dm.store'
import { useAuthStore } from '@/stores/auth.store'
import { getDmRoomDisplayName } from '@/types/dm'
import { CreateDmModal } from '@/components/dm/CreateDmModal'

export function Sidebar() {
  const params = useParams<{ workspaceId: string; channelId?: string; dmRoomId?: string }>()
  const { channels } = useChannelStore()
  const { dmRooms } = useDmStore()
  const { user } = useAuthStore()
  const [isDmModalOpen, setIsDmModalOpen] = useState(false)

  return (
    <>
      <aside className="w-60 bg-gray-800 text-gray-300 flex flex-col h-full">
        {/* チャンネルセクション */}
        <div className="px-4 py-3 border-b border-gray-700">
          <span className="text-sm font-semibold text-white">チャンネル</span>
        </div>
        <nav className="overflow-y-auto py-2 flex-shrink-0 max-h-64">
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

        {/* DMセクション */}
        <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">ダイレクトメッセージ</span>
          <button
            onClick={() => setIsDmModalOpen(true)}
            className="text-gray-400 hover:text-white text-lg leading-none"
            title="新しいDMを開始"
          >
            +
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-1">
          {dmRooms.map((room) => {
            const displayName = user ? getDmRoomDisplayName(room, user.id) : (room.name ?? 'DM')
            return (
              <Link
                key={room.id}
                href={`/${params.workspaceId}/dm/${room.id}`}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm hover:bg-gray-700 transition-colors ${
                  params.dmRoomId === room.id ? 'bg-gray-600 text-white' : 'text-gray-400'
                }`}
              >
                <span className="text-gray-500">@</span>
                <span className="truncate">{displayName}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {isDmModalOpen && <CreateDmModal onClose={() => setIsDmModalOpen(false)} />}
    </>
  )
}
