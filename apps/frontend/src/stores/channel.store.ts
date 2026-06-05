'use client'

import { create } from 'zustand'
import type { Channel } from '@/types/channel'

type ChannelStore = {
  channels: Channel[]
  currentChannel: Channel | null
  setChannels: (channels: Channel[]) => void
  setCurrentChannel: (channel: Channel | null) => void
  addChannel: (channel: Channel) => void
  reset: () => void
}

export const useChannelStore = create<ChannelStore>((set) => ({
  channels: [],
  currentChannel: null,

  setChannels: (channels) => set({ channels }),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  addChannel: (channel) => set((state) => ({ channels: [...state.channels, channel] })),
  reset: () => set({ channels: [], currentChannel: null }),
}))
