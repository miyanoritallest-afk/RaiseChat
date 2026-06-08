'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useChannelStore } from '@/stores/channel.store'
import { useDmStore } from '@/stores/dm.store'
import { workspaceApi } from '@/lib/api/workspace.api'
import { channelApi } from '@/lib/api/channel.api'
import { dmApi } from '@/lib/api/dm.api'
import { cn } from '@/lib/utils'
import { Sidebar } from './Sidebar'
import { NotificationBell } from '@/components/notification/NotificationBell'
import { useNotificationSocket } from '@/hooks/useNotificationSocket'

type Props = {
  workspaceId: string
  children: React.ReactNode
}

export function AppLayout({ workspaceId, children }: Props) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isLoading: authLoading } = useAuthStore()
  const { workspaces, currentWorkspace, setWorkspaces, setCurrentWorkspace } = useWorkspaceStore()
  const { setChannels } = useChannelStore()
  const { setDmRooms } = useDmStore()

  // アプリ全体で1回だけ通知 Socket を購読する
  useNotificationSocket()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    if (workspaces.length === 0) {
      workspaceApi
        .getMyWorkspaces()
        .then(setWorkspaces)
        .catch(() => {})
    }
  }, [user, workspaces.length, setWorkspaces])

  useEffect(() => {
    if (!user) return
    workspaceApi
      .getWorkspace(workspaceId)
      .then(setCurrentWorkspace)
      .catch(() => router.push('/workspaces'))

    channelApi
      .getChannels(workspaceId)
      .then(setChannels)
      .catch(() => {})

    dmApi
      .getDmRooms(workspaceId)
      .then(setDmRooms)
      .catch(() => {})
  }, [user, workspaceId, setCurrentWorkspace, setChannels, setDmRooms, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* ワークスペース切り替えバー */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-3 gap-2 border-r border-gray-800 shrink-0">
        {workspaces.map((ws) => (
          <Link
            key={ws.id}
            href={`/${ws.id}`}
            title={ws.name}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
              ws.id === workspaceId
                ? 'bg-blue-600 text-white rounded-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {ws.name.charAt(0).toUpperCase()}
          </Link>
        ))}
        <Link
          href="/workspaces"
          title="ワークスペース一覧"
          className="w-10 h-10 rounded-xl bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-400 text-xl mt-auto"
        >
          +
        </Link>
      </div>

      {/* モバイル: サイドバーオーバーレイ背景 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* サイドバー（PC: 常時表示、モバイル: ドロワー） */}
      <div
        className={cn(
          'fixed inset-y-0 left-16 z-30 w-60 flex flex-col transition-transform duration-200 md:static md:translate-x-0 md:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
          <span className="text-white font-semibold truncate">{currentWorkspace?.name}</span>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              className="md:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <Sidebar />
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white min-w-0">
        {/* モバイル: ハンバーガーボタン */}
        <div className="md:hidden flex items-center px-3 py-2 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-2 text-sm font-medium text-gray-700 truncate">
            {currentWorkspace?.name}
          </span>
        </div>
        {children}
      </main>
    </div>
  )
}
