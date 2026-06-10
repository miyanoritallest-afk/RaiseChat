'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { workspaceApi } from '@/lib/api/workspace.api'

export function WorkspaceList() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthStore()
  const { workspaces, isLoading, setWorkspaces, setLoading } = useWorkspaceStore()
  const [inviteCode, setInviteCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    workspaceApi
      .getMyWorkspaces()
      .then(setWorkspaces)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, setWorkspaces, setLoading])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setJoinError(null)
    setIsJoining(true)
    try {
      await workspaceApi.joinWorkspace(inviteCode.trim())
      const updated = await workspaceApi.getMyWorkspaces()
      setWorkspaces(updated)
      setInviteCode('')
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : '参加に失敗しました')
    } finally {
      setIsJoining(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ワークスペース</h1>
          <Link
            href="/workspaces/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            新規作成
          </Link>
        </div>

        {workspaces.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 mb-6">
            参加しているワークスペースがありません
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/${ws.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{ws.name}</div>
                    {ws.description && (
                      <div className="text-sm text-gray-500 mt-0.5">{ws.description}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{ws._count?.members ?? 0}人</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">招待コードで参加</h2>
          {joinError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {joinError}
            </div>
          )}
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="招待コードを入力"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isJoining || !inviteCode.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors"
            >
              {isJoining ? '参加中...' : '参加'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
