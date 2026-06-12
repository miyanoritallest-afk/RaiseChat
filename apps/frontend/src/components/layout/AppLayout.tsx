'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, LogOut, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/lib/api/auth.api'
import { WorkspaceSettingsModal } from '@/components/workspace/WorkspaceSettingsModal'
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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const { user, isLoading: authLoading, clearAuth } = useAuthStore()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    clearAuth()
    router.push('/login')
  }
  const { workspaces, currentWorkspace, setWorkspaces, setCurrentWorkspace } = useWorkspaceStore()
  const { setChannels, reset: resetChannels } = useChannelStore()
  const { setDmRooms, reset: resetDmRooms } = useDmStore()

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

    // ワークスペース切り替え時に前のワークスペースのデータを即座にクリア
    resetChannels()
    resetDmRooms()

    workspaceApi
      .getWorkspace(workspaceId)
      .then(setCurrentWorkspace)
      .catch(() => router.push('/workspaces'))

    channelApi
      .getChannels(workspaceId)
      .then((channels) => setChannels(channels, workspaceId))
      .catch(() => {})

    dmApi
      .getDmRooms(workspaceId)
      .then(setDmRooms)
      .catch(() => {})
  }, [
    user,
    workspaceId,
    setCurrentWorkspace,
    setChannels,
    setDmRooms,
    resetChannels,
    resetDmRooms,
    router,
  ])

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
        <button
          onClick={() => setLogoutConfirmOpen(true)}
          title="ログアウト"
          className="w-10 h-10 rounded-xl hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
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
              onClick={() => setSettingsOpen(true)}
              title="ワークスペース設定"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
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

      {settingsOpen && currentWorkspace && (
        <WorkspaceSettingsModal
          workspace={currentWorkspace}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setLogoutConfirmOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">ログアウト</h3>
                <p className="text-sm text-gray-500">本当にログアウトしますか？</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setLogoutConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => void handleLogout()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
