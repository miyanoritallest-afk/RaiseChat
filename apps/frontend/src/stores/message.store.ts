'use client'

import { create } from 'zustand'
import type { Message } from '@/types/message'

type MessageStore = {
  messages: Message[]
  nextCursor: string | null
  hasMore: boolean
  isLoading: boolean
  setMessages: (messages: Message[], nextCursor: string | null, hasMore: boolean) => void
  prependMessages: (messages: Message[], nextCursor: string | null, hasMore: boolean) => void
  addMessage: (message: Message) => void
  updateMessage: (message: Message) => void
  removeMessage: (messageId: string) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],
  nextCursor: null,
  hasMore: false,
  isLoading: false,

  setMessages: (messages, nextCursor, hasMore) => set({ messages, nextCursor, hasMore }),

  prependMessages: (older, nextCursor, hasMore) =>
    set((state) => ({
      messages: [...state.messages, ...older],
      nextCursor,
      hasMore,
    })),

  addMessage: (message) => set((state) => ({ messages: [message, ...state.messages] })),

  updateMessage: (message) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === message.id ? message : m)),
    })),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () => set({ messages: [], nextCursor: null, hasMore: false, isLoading: false }),
}))
