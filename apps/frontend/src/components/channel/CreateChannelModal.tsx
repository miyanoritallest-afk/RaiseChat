'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { channelApi } from '@/lib/api/channel.api'
import { useChannelStore } from '@/stores/channel.store'
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
  wsId: string
  onClose: () => void
}

export function CreateChannelModal({ wsId, onClose }: Props) {
  const router = useRouter()
  const { addChannel } = useChannelStore()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim().toLowerCase().replace(/\s+/g, '-')
    if (!trimmed) return

    setIsSubmitting(true)
    setError('')
    try {
      const channel = await channelApi.createChannel(wsId, { name: trimmed })
      addChannel(channel)
      router.push(`/${wsId}/${channel.id}`)
      onClose()
    } catch {
      setError('チャンネルの作成に失敗しました。名前を確認してください。')
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
          <DialogTitle>チャンネルを作成</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <label className="block text-sm font-medium text-gray-700 mb-1">チャンネル名</label>
          <div className="flex items-center border border-gray-300 rounded-md px-3 mb-3 focus-within:ring-2 focus-within:ring-blue-500">
            <span className="text-gray-400 mr-1">#</span>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: random"
              className="border-0 focus-visible:ring-0 px-0"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive mb-3">⚠ {error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? '作成中...' : '作成'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
