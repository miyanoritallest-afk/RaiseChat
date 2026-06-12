'use client'

import { create } from 'zustand'
import type { Channel } from '@/types/channel'

type ChannelStore = {
  channels: Channel[]
  currentChannel: Channel | null
  loadedWorkspaceId: string | null
  setChannels: (channels: Channel[], workspaceId: string) => void
  setCurrentChannel: (channel: Channel | null) => void
  addChannel: (channel: Channel) => void
  updateChannel: (channel: Channel) => void
  removeChannel: (channelId: string) => void
  reorderChannels: (orderedIds: string[]) => void
  reset: () => void
}

export const useChannelStore = create<ChannelStore>((set) => ({
  channels: [],
  currentChannel: null,
  loadedWorkspaceId: null,

  setChannels: (channels, workspaceId) => set({ channels, loadedWorkspaceId: workspaceId }),
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
  reorderChannels: (orderedIds) =>
    set((state) => {
      const map = new Map(state.channels.map((c) => [c.id, c]))
      const reordered = orderedIds
        .map((id) => map.get(id))
        .filter((c): c is Channel => c !== undefined)
      const rest = state.channels.filter((c) => !orderedIds.includes(c.id))
      return { channels: [...reordered, ...rest] }
    }),
  reset: () => set({ channels: [], currentChannel: null, loadedWorkspaceId: null }),
}))
