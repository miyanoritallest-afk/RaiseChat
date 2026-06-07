import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMessages } from '../useMessages'
import { useMessageStore } from '@/stores/message.store'

vi.mock('@/lib/api/message.api', () => ({
  messageApi: {
    getMessages: vi.fn(),
  },
}))

function makeMessage(id: string) {
  return {
    id,
    content: `Message ${id}`,
    channelId: 'ch-1',
    userId: 'user-1',
    threadId: null,
    user: {
      id: 'user-1',
      username: 'u',
      displayName: 'U',
      avatarUrl: null,
      status: 'ONLINE' as const,
    },
    reactions: [],
    attachments: [],
    _count: { replies: 0 },
    replies: [],
    isDeleted: false,
    editedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

describe('useMessages', () => {
  beforeEach(async () => {
    const { messageApi } = await import('@/lib/api/message.api')
    vi.mocked(messageApi.getMessages).mockReset()
    useMessageStore.getState().reset()
  })

  it('マウント時にgetMessagesを呼び出しstoreにセットする', async () => {
    const { messageApi } = await import('@/lib/api/message.api')
    const messages = [makeMessage('1'), makeMessage('2')]
    vi.mocked(messageApi.getMessages).mockResolvedValue({
      messages,
      nextCursor: null,
      hasMore: false,
    })

    renderHook(() => useMessages('ws-1', 'ch-1'))

    await waitFor(() => {
      expect(useMessageStore.getState().messages).toHaveLength(2)
    })
    expect(messageApi.getMessages).toHaveBeenCalledWith('ws-1', 'ch-1')
  })

  it('channelIdが変わるとメッセージを再取得する', async () => {
    const { messageApi } = await import('@/lib/api/message.api')
    vi.mocked(messageApi.getMessages).mockResolvedValue({
      messages: [makeMessage('ch1-msg')],
      nextCursor: null,
      hasMore: false,
    })

    const { rerender } = renderHook(({ ch }) => useMessages('ws-1', ch), {
      initialProps: { ch: 'ch-1' },
    })

    await waitFor(() => expect(messageApi.getMessages).toHaveBeenCalledTimes(1))

    vi.mocked(messageApi.getMessages).mockResolvedValue({
      messages: [makeMessage('ch2-msg')],
      nextCursor: null,
      hasMore: false,
    })
    useMessageStore.getState().reset()

    rerender({ ch: 'ch-2' })

    await waitFor(() => expect(messageApi.getMessages).toHaveBeenCalledTimes(2))
    expect(messageApi.getMessages).toHaveBeenLastCalledWith('ws-1', 'ch-2')
  })

  it('loadMore: hasMoreがtrueのときnextCursorを使って次ページを取得する', async () => {
    const { messageApi } = await import('@/lib/api/message.api')
    vi.mocked(messageApi.getMessages).mockResolvedValueOnce({
      messages: [makeMessage('latest')],
      nextCursor: 'cursor-1',
      hasMore: true,
    })

    const { result } = renderHook(() => useMessages('ws-1', 'ch-1'))

    await waitFor(() => expect(useMessageStore.getState().messages).toHaveLength(1))

    vi.mocked(messageApi.getMessages).mockResolvedValueOnce({
      messages: [makeMessage('older')],
      nextCursor: null,
      hasMore: false,
    })

    await result.current.loadMore()

    await waitFor(() => expect(useMessageStore.getState().messages).toHaveLength(2))
    expect(messageApi.getMessages).toHaveBeenCalledWith('ws-1', 'ch-1', 'cursor-1')
  })

  it('loadMore: hasMoreがfalseのときは何もしない', async () => {
    const { messageApi } = await import('@/lib/api/message.api')
    vi.mocked(messageApi.getMessages).mockResolvedValueOnce({
      messages: [makeMessage('1')],
      nextCursor: null,
      hasMore: false,
    })

    const { result } = renderHook(() => useMessages('ws-1', 'ch-1'))
    await waitFor(() => expect(useMessageStore.getState().messages).toHaveLength(1))

    const callCountBefore = vi.mocked(messageApi.getMessages).mock.calls.length
    await result.current.loadMore()

    expect(vi.mocked(messageApi.getMessages).mock.calls.length).toBe(callCountBefore)
  })
})
