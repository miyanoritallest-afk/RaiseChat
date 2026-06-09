import { create } from 'zustand'
import type { Notification } from '@/types/notification'

function computeUnreadSets(notifications: Notification[]) {
  const channelIds = new Set<string>()
  const dmRoomIds = new Set<string>()
  for (const n of notifications) {
    if (n.isRead) continue
    if (n.channelId) channelIds.add(n.channelId)
    if (n.dmRoomId) dmRoomIds.add(n.dmRoomId)
  }
  return { channelIds, dmRoomIds }
}

type NotificationStore = {
  notifications: Notification[]
  unreadCount: number
  unreadChannelIds: Set<string>
  unreadDmRoomIds: Set<string>
  nextCursor: string | null
  hasMore: boolean
  isLoading: boolean
  isDropdownOpen: boolean

  setNotifications: (
    notifications: Notification[],
    nextCursor: string | null,
    hasMore: boolean,
    unreadCount: number,
  ) => void
  prependNotification: (notification: Notification) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  markReadForChannel: (channelId: string) => void
  markReadForDmRoom: (dmRoomId: string) => void
  setUnreadCount: (count: number) => void
  incrementUnreadCount: () => void
  setIsLoading: (isLoading: boolean) => void
  openDropdown: () => void
  closeDropdown: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  unreadChannelIds: new Set(),
  unreadDmRoomIds: new Set(),
  nextCursor: null,
  hasMore: false,
  isLoading: false,
  isDropdownOpen: false,

  setNotifications: (notifications, nextCursor, hasMore, unreadCount) => {
    const { channelIds, dmRoomIds } = computeUnreadSets(notifications)
    set({
      notifications,
      nextCursor,
      hasMore,
      unreadCount,
      unreadChannelIds: channelIds,
      unreadDmRoomIds: dmRoomIds,
    })
  },

  prependNotification: (notification) =>
    set((state) => {
      const notifications = [notification, ...state.notifications]
      const { channelIds, dmRoomIds } = computeUnreadSets(notifications)
      return {
        notifications,
        unreadCount: state.unreadCount + 1,
        unreadChannelIds: channelIds,
        unreadDmRoomIds: dmRoomIds,
      }
    }),

  markAsRead: (notificationId) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n,
      )
      const { channelIds, dmRoomIds } = computeUnreadSets(notifications)
      return {
        notifications,
        unreadCount: Math.max(0, state.unreadCount - 1),
        unreadChannelIds: channelIds,
        unreadDmRoomIds: dmRoomIds,
      }
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
      unreadChannelIds: new Set(),
      unreadDmRoomIds: new Set(),
    })),

  markReadForChannel: (channelId) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.channelId === channelId ? { ...n, isRead: true } : n,
      )
      const { channelIds, dmRoomIds } = computeUnreadSets(notifications)
      const markedCount = state.notifications.filter(
        (n) => n.channelId === channelId && !n.isRead,
      ).length
      return {
        notifications,
        unreadCount: Math.max(0, state.unreadCount - markedCount),
        unreadChannelIds: channelIds,
        unreadDmRoomIds: dmRoomIds,
      }
    }),

  markReadForDmRoom: (dmRoomId) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.dmRoomId === dmRoomId ? { ...n, isRead: true } : n,
      )
      const { channelIds, dmRoomIds } = computeUnreadSets(notifications)
      const markedCount = state.notifications.filter(
        (n) => n.dmRoomId === dmRoomId && !n.isRead,
      ).length
      return {
        notifications,
        unreadCount: Math.max(0, state.unreadCount - markedCount),
        unreadChannelIds: channelIds,
        unreadDmRoomIds: dmRoomIds,
      }
    }),

  setUnreadCount: (unreadCount) => set({ unreadCount }),
  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  setIsLoading: (isLoading) => set({ isLoading }),
  openDropdown: () => set({ isDropdownOpen: true }),
  closeDropdown: () => set({ isDropdownOpen: false }),
}))
