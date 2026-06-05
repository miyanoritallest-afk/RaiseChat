'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useChannelStore } from '@/stores/channel.store'
import { workspaceApi } from '@/lib/api/workspace.api'
import { channelApi } from '@/lib/api/channel.api'
import { Sidebar } from './Sidebar'

type Props = {
  workspaceId: string
  children: React.ReactNode
}

export function AppLayout({ workspaceId, children }: Props) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthStore()
  const { workspaces, currentWorkspace, setWorkspaces, setCurrentWorkspace } = useWorkspaceStore()
  const { setChannels } = useChannelStore()

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
  }, [user, workspaceId, setCurrentWorkspace, setChannels, router])

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
      <div className="w-16 bg-gray-900 flex flex-col items-center py-3 gap-2 border-r border-gray-800">
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

      {/* サイドバー */}
      <div className="w-60 flex flex-col">
        <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
          <span className="text-white font-semibold truncate">{currentWorkspace?.name}</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <Sidebar />
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white">{children}</main>
    </div>
  )
}
