'use client'

import { create } from 'zustand'
import type { Pin } from '@/types/pin'

type PinStore = {
  pins: Pin[]
  isPanelOpen: boolean
  setPins: (pins: Pin[]) => void
  addPin: (pin: Pin) => void
  removePin: (pinId: string) => void
  togglePanel: () => void
  reset: () => void
}

export const usePinStore = create<PinStore>((set) => ({
  pins: [],
  isPanelOpen: false,

  setPins: (pins) => set({ pins }),

  addPin: (pin) =>
    set((state) => ({
      pins: state.pins.some((p) => p.id === pin.id) ? state.pins : [pin, ...state.pins],
    })),

  removePin: (pinId) => set((state) => ({ pins: state.pins.filter((p) => p.id !== pinId) })),

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  reset: () => set({ pins: [], isPanelOpen: false }),
}))
