'use client'

import { create } from 'zustand'
import type { DmRoom, DmMessage } from '@/types/dm'

type DmStore = {
  dmRooms: DmRoom[]
  currentRoom: DmRoom | null
  messages: DmMessage[]
  nextCursor: string | null
  hasMore: boolean
  isLoading: boolean

  setDmRooms: (rooms: DmRoom[]) => void
  addDmRoom: (room: DmRoom) => void
  setCurrentRoom: (room: DmRoom | null) => void
  setMessages: (messages: DmMessage[], nextCursor: string | null, hasMore: boolean) => void
  prependMessages: (older: DmMessage[], nextCursor: string | null, hasMore: boolean) => void
  addMessage: (message: DmMessage) => void
  updateMessage: (message: DmMessage) => void
  removeMessage: (messageId: string) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useDmStore = create<DmStore>((set) => ({
  dmRooms: [],
  currentRoom: null,
  messages: [],
  nextCursor: null,
  hasMore: false,
  isLoading: false,

  setDmRooms: (rooms) => set({ dmRooms: rooms }),

  addDmRoom: (room) =>
    set((state) => ({
      dmRooms: [room, ...state.dmRooms.filter((r) => r.id !== room.id)],
    })),

  setCurrentRoom: (room) => set({ currentRoom: room }),

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
    set((state) => ({ messages: state.messages.filter((m) => m.id !== messageId) })),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () =>
    set({ currentRoom: null, messages: [], nextCursor: null, hasMore: false, isLoading: false }),
}))
