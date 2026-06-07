import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSocket } from '../useSocket'
import { useMessageStore } from '@/stores/message.store'

// getSocket モック（setup.ts で既にモック済み。ここでは各テストで spy を設定する）
const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn(),
}

vi.mock('@/lib/socket/socket.client', () => ({
  getSocket: vi.fn(() => mockSocket),
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn((selector: (s: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'user-1' } }),
  ),
}))

vi.mock('@/stores/pin.store', () => ({
  usePinStore: Object.assign(
    vi.fn(() => ({ addPin: vi.fn(), removePin: vi.fn() })),
    {
      getState: vi.fn(() => ({ addPin: vi.fn(), removePin: vi.fn() })),
    },
  ),
}))

vi.mock('@/hooks/useReaction', () => ({
  createReactionUpdatedHandler: vi.fn(() => vi.fn()),
}))

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useMessageStore.getState().reset()
  })

  it('マウント時にworkspace:joinとchannel:joinをemitする', () => {
    renderHook(() => useSocket('ch-1', 'ws-1'))

    expect(mockSocket.emit).toHaveBeenCalledWith('workspace:join', { workspaceId: 'ws-1' })
    expect(mockSocket.emit).toHaveBeenCalledWith('channel:join', { channelId: 'ch-1' })
  })

  it('イベントハンドラが正しく登録される', () => {
    renderHook(() => useSocket('ch-1', 'ws-1'))

    const registeredEvents = mockSocket.on.mock.calls.map((args: string[]) => args[0])
    expect(registeredEvents).toContain('message:received')
    expect(registeredEvents).toContain('message:updated')
    expect(registeredEvents).toContain('message:deleted')
    expect(registeredEvents).toContain('reaction:updated')
    expect(registeredEvents).toContain('pin:updated')
  })

  it('アンマウント時にイベントハンドラがクリーンアップされる（socket.off が呼ばれる）', () => {
    const { unmount } = renderHook(() => useSocket('ch-1', 'ws-1'))
    unmount()

    const removedEvents = mockSocket.off.mock.calls.map((args: string[]) => args[0])
    expect(removedEvents).toContain('message:received')
    expect(removedEvents).toContain('message:updated')
    expect(removedEvents).toContain('message:deleted')
  })

  it('message:receivedイベントでaddMessageが呼ばれる', () => {
    renderHook(() => useSocket('ch-1', 'ws-1'))

    // socket.on('message:received', handler) のハンドラを取得して呼び出す
    const onCalls = mockSocket.on.mock.calls as [string, (payload: unknown) => void][]
    const receivedHandler = onCalls.find(([event]) => event === 'message:received')?.[1]
    expect(receivedHandler).toBeDefined()

    const msg = {
      id: 'new-msg',
      content: 'Hello',
      channelId: 'ch-1',
      userId: 'user-1',
      threadId: null,
      user: { id: 'user-1', username: 'u', displayName: 'U', avatarUrl: null, status: 'ONLINE' },
      reactions: [],
      attachments: [],
      _count: { replies: 0 },
      replies: [],
      isDeleted: false,
      editedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    receivedHandler!(msg)

    expect(useMessageStore.getState().messages[0].id).toBe('new-msg')
  })

  it('threadIdがあるメッセージはaddMessageを呼ばない（スレッド返信はタイムラインに追加しない）', () => {
    renderHook(() => useSocket('ch-1', 'ws-1'))

    const onCalls = mockSocket.on.mock.calls as [string, (payload: unknown) => void][]
    const receivedHandler = onCalls.find(([event]) => event === 'message:received')?.[1]

    const threadReply = {
      id: 'reply-msg',
      content: 'Reply',
      channelId: 'ch-1',
      userId: 'user-1',
      threadId: 'parent-msg-id',
      user: { id: 'user-1', username: 'u', displayName: 'U', avatarUrl: null, status: 'ONLINE' },
      reactions: [],
      attachments: [],
      _count: { replies: 0 },
      replies: [],
      isDeleted: false,
      editedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    receivedHandler!(threadReply)

    expect(useMessageStore.getState().messages).toHaveLength(0)
  })
})
