'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { dmApi } from '@/lib/api/dm.api'
import { useDmStore } from '@/stores/dm.store'
import { useWorkspaceStore } from '@/stores/workspace.store'

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
      // ユーザーIDでDM作成（暫定：userIdを直接入力する仕様）
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">ダイレクトメッセージを開始</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <label className="block text-sm font-medium text-gray-700 mb-1">ユーザーID</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="宛先のユーザーIDを入力"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            autoFocus
          />
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!username.trim() || isSubmitting}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg"
            >
              {isSubmitting ? '作成中...' : 'DMを開始'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
