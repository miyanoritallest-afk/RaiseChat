'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Copy, Check, Pencil, Trash2 } from 'lucide-react'
import type { Workspace, WorkspaceMember } from '@/types/workspace'
import { workspaceApi } from '@/lib/api/workspace.api'
import { useAuthStore } from '@/stores/auth.store'
import { useWorkspaceStore } from '@/stores/workspace.store'

type Tab = 'overview' | 'members'

type Props = {
  workspace: Workspace
  onClose: () => void
}

export function WorkspaceSettingsModal({ workspace, onClose }: Props) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { updateWorkspace, removeWorkspace } = useWorkspaceStore()

  const [tab, setTab] = useState<Tab>('overview')
  const [copied, setCopied] = useState(false)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(workspace.name)
  const [isRenameSubmitting, setIsRenameSubmitting] = useState(false)
  const [renameError, setRenameError] = useState('')

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = members.some((m) => m.user.id === user?.id && m.role === 'OWNER')

  useEffect(() => {
    // メンバー一覧は概要タブでもOWNER判定に使うため常に取得
    workspaceApi
      .getMembers(workspace.id)
      .then(setMembers)
      .catch(() => {})
  }, [workspace.id])

  useEffect(() => {
    if (tab !== 'members' || isLoadingMembers) return
    setIsLoadingMembers(true)
    workspaceApi
      .getMembers(workspace.id)
      .then((data) => {
        setMembers(data)
        setIsLoadingMembers(false)
      })
      .catch(() => setIsLoadingMembers(false))
  }, [tab, workspace.id, isLoadingMembers])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(workspace.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRenameSubmit = async () => {
    const trimmed = renameValue.trim()
    if (!trimmed) return
    if (trimmed === workspace.name) {
      setIsRenaming(false)
      return
    }
    setIsRenameSubmitting(true)
    setRenameError('')
    try {
      const updated = await workspaceApi.updateWorkspace(workspace.id, { name: trimmed })
      updateWorkspace(updated)
      setIsRenaming(false)
    } catch (e) {
      setRenameError(e instanceof Error ? e.message : '更新に失敗しました')
    } finally {
      setIsRenameSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await workspaceApi.deleteWorkspace(workspace.id)
      removeWorkspace(workspace.id)
      onClose()
      router.push('/workspaces')
    } catch {
      setIsDeleting(false)
      setDeleteConfirm(false)
    }
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
              {/* ワークスペース名（OWNERのみ編集可） */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-700">ワークスペース名</p>
                  {isOwner && !isRenaming && (
                    <button
                      onClick={() => {
                        setRenameValue(workspace.name)
                        setRenameError('')
                        setIsRenaming(true)
                      }}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <Pencil className="w-3 h-3" />
                      変更
                    </button>
                  )}
                </div>
                {isRenaming ? (
                  <div className="space-y-2">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleRenameSubmit()
                        if (e.key === 'Escape') setIsRenaming(false)
                      }}
                      disabled={isRenameSubmitting}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    {renameError && <p className="text-xs text-red-500">{renameError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleRenameSubmit()}
                        disabled={isRenameSubmitting || !renameValue.trim()}
                        className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setIsRenaming(false)}
                        className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-900">{workspace.name}</p>
                )}
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

              {/* ワークスペース削除（OWNERのみ） */}
              {isOwner && (
                <div className="pt-2 border-t border-gray-100">
                  {deleteConfirm ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                      <p className="text-sm text-red-700 font-medium">本当に削除しますか？</p>
                      <p className="text-xs text-red-500">
                        ワークスペース内のすべてのチャンネル・メッセージが削除されます。この操作は取り消せません。
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => void handleDelete()}
                          disabled={isDeleting}
                          className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          {isDeleting ? '削除中...' : '削除する'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(false)}
                          className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      ワークスペースを削除
                    </button>
                  )}
                </div>
              )}
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
