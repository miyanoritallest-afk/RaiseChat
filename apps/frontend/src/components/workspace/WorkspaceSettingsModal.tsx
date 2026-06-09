'use client'

import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'
import type { Workspace } from '@/types/workspace'

type Props = {
  workspace: Workspace
  onClose: () => void
}

export function WorkspaceSettingsModal({ workspace, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(workspace.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">ワークスペース設定</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
      </div>
    </div>
  )
}
