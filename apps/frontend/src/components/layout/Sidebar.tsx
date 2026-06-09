'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react'
import { useChannelStore } from '@/stores/channel.store'
import { useDmStore } from '@/stores/dm.store'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { getDmRoomDisplayName } from '@/types/dm'
import type { Channel } from '@/types/channel'
import type { DmRoom } from '@/types/dm'
import { channelApi } from '@/lib/api/channel.api'
import { dmApi } from '@/lib/api/dm.api'
import { CreateDmModal } from '@/components/dm/CreateDmModal'
import { SearchModal } from '@/components/search/SearchModal'
import { CreateChannelModal } from '@/components/channel/CreateChannelModal'

// チャンネル行コンポーネント
function ChannelRow({
  channel,
  isActive,
  workspaceId,
  isBold,
}: {
  channel: Channel
  isActive: boolean
  workspaceId: string
  isBold: boolean
}) {
  const router = useRouter()
  const { updateChannel, removeChannel } = useChannelStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(channel.name)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) inputRef.current?.focus()
  }, [isRenaming])

  useEffect(() => {
    if (!menuOpen) return
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  const handleRenameSubmit = async () => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === channel.name) {
      setIsRenaming(false)
      setRenameValue(channel.name)
      return
    }
    setIsSubmitting(true)
    try {
      const updated = await channelApi.updateChannel(workspaceId, channel.id, { name: trimmed })
      updateChannel(updated)
      setIsRenaming(false)
    } catch {
      setRenameValue(channel.name)
      setIsRenaming(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setMenuOpen(false)
    try {
      await channelApi.deleteChannel(workspaceId, channel.id)
      removeChannel(channel.id)
      router.push(`/${workspaceId}`)
    } catch {
      // OWNERでなければ403 — 黙って無視
    }
  }

  return (
    <div
      className={`group flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-gray-700 transition-colors ${
        isActive ? 'bg-gray-600 text-white' : 'text-gray-400'
      }`}
    >
      <span className="text-gray-500 flex-shrink-0">#</span>
      {isRenaming ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleRenameSubmit()
              if (e.key === 'Escape') {
                setIsRenaming(false)
                setRenameValue(channel.name)
              }
            }}
            disabled={isSubmitting}
            className="flex-1 min-w-0 bg-gray-900 text-white text-sm px-1 py-0.5 rounded border border-blue-500 outline-none"
          />
          <button
            onClick={() => void handleRenameSubmit()}
            disabled={isSubmitting}
            className="text-green-400 hover:text-green-300 flex-shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setIsRenaming(false)
              setRenameValue(channel.name)
            }}
            className="text-gray-400 hover:text-gray-300 flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <Link
            href={`/${workspaceId}/${channel.id}`}
            className={`flex-1 truncate ${isBold ? 'font-semibold text-white' : ''}`}
          >
            {channel.name}
          </Link>
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={(e) => {
                e.preventDefault()
                setMenuOpen((v) => !v)
              }}
              className="hidden group-hover:flex items-center justify-center w-5 h-5 rounded hover:bg-gray-600 text-gray-400 hover:text-gray-200"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-6 z-50 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1">
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    setIsRenaming(true)
                    setRenameValue(channel.name)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-400" />
                  名前を変更
                </button>
                <button
                  onClick={() => void handleDelete()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  チャンネルを削除
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// DMグループ行コンポーネント
function DmRoomRow({
  room,
  isActive,
  workspaceId,
  myUserId,
  isBold,
}: {
  room: DmRoom
  isActive: boolean
  workspaceId: string
  myUserId: string
  isBold: boolean
}) {
  const { updateDmRoom } = useDmStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(room.name ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayName = getDmRoomDisplayName(room, myUserId)

  useEffect(() => {
    if (isRenaming) inputRef.current?.focus()
  }, [isRenaming])

  useEffect(() => {
    if (!menuOpen) return
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  const handleRenameSubmit = async () => {
    const trimmed = renameValue.trim()
    if (!trimmed) {
      setIsRenaming(false)
      setRenameValue(room.name ?? '')
      return
    }
    setIsSubmitting(true)
    try {
      const updated = await dmApi.updateDmRoom(room.id, trimmed)
      updateDmRoom(updated)
      setIsRenaming(false)
    } catch {
      setRenameValue(room.name ?? '')
      setIsRenaming(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={`group flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-gray-700 transition-colors ${
        isActive ? 'bg-gray-600 text-white' : 'text-gray-400'
      }`}
    >
      <span className="text-gray-500 flex-shrink-0">{room.isGroup ? '#' : '@'}</span>
      {isRenaming ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleRenameSubmit()
              if (e.key === 'Escape') {
                setIsRenaming(false)
                setRenameValue(room.name ?? '')
              }
            }}
            disabled={isSubmitting}
            className="flex-1 min-w-0 bg-gray-900 text-white text-sm px-1 py-0.5 rounded border border-blue-500 outline-none"
          />
          <button
            onClick={() => void handleRenameSubmit()}
            disabled={isSubmitting}
            className="text-green-400 hover:text-green-300 flex-shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setIsRenaming(false)
              setRenameValue(room.name ?? '')
            }}
            className="text-gray-400 hover:text-gray-300 flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <Link
            href={`/${workspaceId}/dm/${room.id}`}
            className={`flex-1 truncate ${isBold ? 'font-semibold text-white' : ''}`}
          >
            {displayName}
          </Link>
          {room.isGroup && (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setMenuOpen((v) => !v)
                }}
                className="hidden group-hover:flex items-center justify-center w-5 h-5 rounded hover:bg-gray-600 text-gray-400 hover:text-gray-200"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <div className="absolute left-0 top-6 z-50 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      setIsRenaming(true)
                      setRenameValue(room.name ?? displayName)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    グループ名を変更
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function Sidebar() {
  const params = useParams<{ workspaceId: string; channelId?: string; dmRoomId?: string }>()
  const { channels } = useChannelStore()
  const { dmRooms } = useDmStore()
  const { user } = useAuthStore()
  const { unreadChannelIds, unreadDmRoomIds } = useNotificationStore()
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
            <ChannelRow
              key={ch.id}
              channel={ch}
              isActive={params.channelId === ch.id}
              workspaceId={params.workspaceId}
              isBold={unreadChannelIds.has(ch.id)}
            />
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
          {dmRooms.map((room) => (
            <DmRoomRow
              key={room.id}
              room={room}
              isActive={params.dmRoomId === room.id}
              workspaceId={params.workspaceId}
              myUserId={user?.id ?? ''}
              isBold={unreadDmRoomIds.has(room.id)}
            />
          ))}
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
