'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check } from 'lucide-react'
import type { Workspace, WorkspaceMember } from '@/types/workspace'
import { workspaceApi } from '@/lib/api/workspace.api'

type Tab = 'overview' | 'members'

type Props = {
  workspace: Workspace
  onClose: () => void
}

export function WorkspaceSettingsModal({ workspace, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [copied, setCopied] = useState(false)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  useEffect(() => {
    if (tab !== 'members' || members.length > 0) return
    setIsLoadingMembers(true)
    workspaceApi
      .getMembers(workspace.id)
      .then(setMembers)
      .catch(() => {})
      .finally(() => setIsLoadingMembers(false))
  }, [tab, workspace.id, members.length])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(workspace.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">ワークスペース設定</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setTab('overview')}
            className={`pb-2 mr-6 text-sm font-medium border-b-2 transition-colors ${
              tab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            概要
          </button>
          <button
            onClick={() => setTab('members')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'members'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            メンバー
          </button>
        </div>

        {/* コンテンツ */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {tab === 'overview' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">ワークスペース名</p>
                <p className="text-sm text-gray-900">{workspace.name}</p>
              </div>

              {workspace.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">説明</p>
                  <p className="text-sm text-gray-600">{workspace.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">メンバー数</p>
                <p className="text-sm text-gray-900">{workspace._count.members} 人</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">招待コード</p>
                <p className="text-xs text-gray-500 mb-2">
                  このコードを共有することで、メンバーをワークスペースに招待できます。
                </p>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <code className="flex-1 text-sm font-mono text-gray-800 select-all">
                    {workspace.inviteCode}
                  </code>
                  <button
                    onClick={() => void handleCopy()}
                    className="flex-shrink-0 p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                    title="コピー"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'members' && (
            <div>
              {isLoadingMembers ? (
                <p className="text-sm text-gray-400 text-center py-8">読み込み中...</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">メンバーがいません</p>
              ) : (
                <ul className="space-y-2">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 py-1.5">
                      <div className="w-9 h-9 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
                        {m.user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {m.user.displayName}
                          </span>
                          {m.role === 'OWNER' && (
                            <span className="flex-shrink-0 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
                              オーナー
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">@{m.user.username}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
