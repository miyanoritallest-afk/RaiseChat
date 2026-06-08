'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { dmApi } from '@/lib/api/dm.api'
import { useDmStore } from '@/stores/dm.store'
import { useWorkspaceStore } from '@/stores/workspace.store'
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
  const [username, setUsername] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !currentWorkspace) return

    setIsSubmitting(true)
    setError('')
    try {
      const room = await dmApi.createDmRoom(currentWorkspace.id, {
        memberIds: [username.trim()],
      })
      addDmRoom(room)
      router.push(`/${currentWorkspace.id}/dm/${room.id}`)
      onClose()
    } catch {
      setError('DMの作成に失敗しました。ユーザーIDを確認してください。')
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

        <form onSubmit={(e) => void handleSubmit(e)}>
          <label className="block text-sm font-medium text-gray-700 mb-1">ユーザーID</label>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="宛先のユーザーIDを入力"
            className="mb-3"
            autoFocus
          />
          {error && <p className="text-sm text-destructive mb-3">⚠ {error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={!username.trim() || isSubmitting}>
              {isSubmitting ? '作成中...' : 'DMを開始'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
