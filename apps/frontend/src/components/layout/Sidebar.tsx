'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useChannelStore } from '@/stores/channel.store'
import { useDmStore } from '@/stores/dm.store'
import { useAuthStore } from '@/stores/auth.store'
import { getDmRoomDisplayName } from '@/types/dm'
import { CreateDmModal } from '@/components/dm/CreateDmModal'
import { SearchModal } from '@/components/search/SearchModal'
import { CreateChannelModal } from '@/components/channel/CreateChannelModal'

export function Sidebar() {
  const params = useParams<{ workspaceId: string; channelId?: string; dmRoomId?: string }>()
  const { channels } = useChannelStore()
  const { dmRooms } = useDmStore()
  const { user } = useAuthStore()
  const [isDmModalOpen, setIsDmModalOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false)

  // Cmd+K / Ctrl+K で検索モーダルを開く
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <aside className="w-60 bg-gray-800 text-gray-300 flex flex-col h-full">
        {/* 検索ボタン */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="flex-1 text-left">検索</span>
            <kbd className="text-xs text-gray-500">⌘K</kbd>
          </button>
        </div>

        {/* チャンネルセクション */}
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">チャンネル</span>
          <button
            onClick={() => setIsChannelModalOpen(true)}
            className="text-gray-400 hover:text-white text-lg leading-none"
            title="チャンネルを追加"
          >
            +
          </button>
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
      {isSearchOpen && params.workspaceId && (
        <SearchModal wsId={params.workspaceId} onClose={() => setIsSearchOpen(false)} />
      )}
      {isChannelModalOpen && params.workspaceId && (
        <CreateChannelModal
          wsId={params.workspaceId}
          onClose={() => setIsChannelModalOpen(false)}
        />
      )}
    </>
  )
}
