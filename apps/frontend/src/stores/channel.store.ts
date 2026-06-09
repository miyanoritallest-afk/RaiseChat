'use client'

import { create } from 'zustand'
import type { Channel } from '@/types/channel'

type ChannelStore = {
  channels: Channel[]
  currentChannel: Channel | null
  setChannels: (channels: Channel[]) => void
  setCurrentChannel: (channel: Channel | null) => void
  addChannel: (channel: Channel) => void
  updateChannel: (channel: Channel) => void
  removeChannel: (channelId: string) => void
  reset: () => void
}

export const useChannelStore = create<ChannelStore>((set) => ({
  channels: [],
  currentChannel: null,

  setChannels: (channels) => set({ channels }),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),
  addChannel: (channel) => set((state) => ({ channels: [...state.channels, channel] })),
  updateChannel: (channel) =>
    set((state) => ({
      channels: state.channels.map((c) => (c.id === channel.id ? channel : c)),
      currentChannel: state.currentChannel?.id === channel.id ? channel : state.currentChannel,
    })),
  removeChannel: (channelId) =>
    set((state) => ({
      channels: state.channels.filter((c) => c.id !== channelId),
      currentChannel: state.currentChannel?.id === channelId ? null : state.currentChannel,
    })),
  reset: () => set({ channels: [], currentChannel: null }),
}))
