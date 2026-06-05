'use client'

import { create } from 'zustand'
import type { Message } from '@/types/message'
import type { ThreadReply } from '@/types/thread'

type ThreadStore = {
  isOpen: boolean
  parentMessage: Message | null
  replies: ThreadReply[]
  nextCursor: string | null
  hasMore: boolean
  isLoading: boolean

  openThread: (message: Message) => void
  closeThread: () => void
  setReplies: (replies: ThreadReply[], nextCursor: string | null, hasMore: boolean) => void
  appendReplies: (older: ThreadReply[], nextCursor: string | null, hasMore: boolean) => void
  addReply: (reply: ThreadReply) => void
  updateReply: (reply: ThreadReply) => void
  removeReply: (replyId: string) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useThreadStore = create<ThreadStore>((set) => ({
  isOpen: false,
  parentMessage: null,
  replies: [],
  nextCursor: null,
  hasMore: false,
  isLoading: false,

  openThread: (message) =>
    set({ isOpen: true, parentMessage: message, replies: [], nextCursor: null, hasMore: false }),

  closeThread: () => set({ isOpen: false, parentMessage: null, replies: [] }),

  setReplies: (replies, nextCursor, hasMore) => set({ replies, nextCursor, hasMore }),

  // 過去の返信を末尾に追加（スレッドは昇順表示のため先頭に追加）
  appendReplies: (older, nextCursor, hasMore) =>
    set((state) => ({
      replies: [...older, ...state.replies],
      nextCursor,
      hasMore,
    })),

  addReply: (reply) => set((state) => ({ replies: [...state.replies, reply] })),

  updateReply: (reply) =>
    set((state) => ({
      replies: state.replies.map((r) => (r.id === reply.id ? reply : r)),
    })),

  removeReply: (replyId) =>
    set((state) => ({ replies: state.replies.filter((r) => r.id !== replyId) })),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () =>
    set({
      isOpen: false,
      parentMessage: null,
      replies: [],
      nextCursor: null,
      hasMore: false,
      isLoading: false,
    }),
}))
