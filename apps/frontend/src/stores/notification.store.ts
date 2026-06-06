import { create } from 'zustand'
import type { Notification } from '@/types/notification'

type NotificationStore = {
  notifications: Notification[]
  unreadCount: number
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
  setUnreadCount: (count: number) => void
  incrementUnreadCount: () => void
  setIsLoading: (isLoading: boolean) => void
  openDropdown: () => void
  closeDropdown: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  nextCursor: null,
  hasMore: false,
  isLoading: false,
  isDropdownOpen: false,

  setNotifications: (notifications, nextCursor, hasMore, unreadCount) =>
    set({ notifications, nextCursor, hasMore, unreadCount }),

  prependNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  setUnreadCount: (unreadCount) => set({ unreadCount }),
  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  setIsLoading: (isLoading) => set({ isLoading }),
  openDropdown: () => set({ isDropdownOpen: true }),
  closeDropdown: () => set({ isDropdownOpen: false }),
}))
