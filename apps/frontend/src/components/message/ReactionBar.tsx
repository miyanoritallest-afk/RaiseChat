'use client'

import type { MessageReaction } from '@/types/message'

type Props = {
  reactions: MessageReaction[]
  onToggle: (emoji: string) => void
}

export function ReactionBar({ reactions, onToggle }: Props) {
  if (reactions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onToggle(r.emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border transition-colors ${
            r.hasMe
              ? 'border-blue-400 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
          }`}
          title={r.hasMe ? 'リアクションを取り消す' : 'リアクションする'}
        >
          <span>{r.emoji}</span>
          <span className="text-xs font-medium">{r.count}</span>
        </button>
      ))}
    </div>
  )
}
