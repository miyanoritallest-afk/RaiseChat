'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { dmApi } from '@/lib/api/dm.api'
import { workspaceApi } from '@/lib/api/workspace.api'
import { useDmStore } from '@/stores/dm.store'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useAuthStore } from '@/stores/auth.store'
import type { WorkspaceMember } from '@/types/workspace'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Props = {
  onClose: () => void
}

export function CreateDmModal({ onClose }: Props) {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()
  const { addDmRoom } = useDmStore()
  const { user } = useAuthStore()

  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [groupName, setGroupName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isGroup = selectedIds.size > 1

  useEffect(() => {
    if (!currentWorkspace) return
    workspaceApi
      .getMembers(currentWorkspace.id)
      .then((list) => setMembers(list.filter((m) => m.user.id !== user?.id)))
      .catch(() => {})
      .finally(() => setIsLoadingMembers(false))
  }, [currentWorkspace, user?.id])

  const filteredMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          m.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.user.username.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [members, searchQuery],
  )

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const handleSubmit = async () => {
    if (selectedIds.size === 0 || !currentWorkspace) return
    setIsSubmitting(true)
    setError('')
    try {
      const memberIds = Array.from(selectedIds)
      const autoName = isGroup
        ? members
            .filter((m) => selectedIds.has(m.user.id))
            .map((m) => m.user.displayName)
            .join(', ')
        : undefined
      const name = isGroup ? groupName.trim() || autoName : undefined
      const room = await dmApi.createDmRoom(currentWorkspace.id, { memberIds, name })
      addDmRoom(room)
      router.push(`/${currentWorkspace.id}/dm/${room.id}`)
      onClose()
    } catch {
      setError('DMの作成に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ダイレクトメッセージを開始</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="名前で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />

        <div className="max-h-60 overflow-y-auto space-y-0.5 mt-1 -mx-1">
          {isLoadingMembers ? (
            <p className="text-sm text-gray-400 text-center py-6">読み込み中...</p>
          ) : filteredMembers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">メンバーが見つかりません</p>
          ) : (
            filteredMembers.map((m) => {
              const isSelected = selectedIds.has(m.user.id)
              return (
                <button
                  key={m.user.id}
                  type="button"
                  onClick={() => toggleSelect(m.user.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
                    {m.user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {m.user.displayName}
                    </p>
                    <p className="text-xs text-gray-400">@{m.user.username}</p>
                  </div>
                  {isSelected && <span className="text-blue-600 text-sm font-bold">✓</span>}
                </button>
              )
            })
          )}
        </div>

        {isGroup && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              グループ名（任意）
            </label>
            <Input
              placeholder="未入力の場合はメンバー名を使用"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
        )}

        {error && <p className="text-sm text-destructive">⚠ {error}</p>}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            type="button"
            disabled={selectedIds.size === 0 || isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? '作成中...' : isGroup ? 'グループDMを作成' : 'DMを開始'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
