import { describe, it, expect, beforeEach } from 'vitest'
import { useMessageStore } from '../message.store'
import type { Message } from '@/types/message'

function makeMessage(id: string, content = `Message ${id}`): Message {
  return {
    id,
    content,
    channelId: 'ch-1',
    userId: 'user-1',
    threadId: null,
    user: {
      id: 'user-1',
      username: 'testuser',
      displayName: 'Test',
      avatarUrl: null,
      status: 'ONLINE',
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

describe('useMessageStore', () => {
  beforeEach(() => {
    useMessageStore.getState().reset()
  })

  describe('setMessages', () => {
    it('メッセージリストをセットする', () => {
      const msgs = [makeMessage('1'), makeMessage('2')]
      useMessageStore.getState().setMessages(msgs, 'cursor-1', true)

      const { messages, nextCursor, hasMore } = useMessageStore.getState()
      expect(messages).toHaveLength(2)
      expect(nextCursor).toBe('cursor-1')
      expect(hasMore).toBe(true)
    })
  })

  describe('addMessage', () => {
    it('新しいメッセージがリストの先頭に追加される', () => {
      useMessageStore.getState().setMessages([makeMessage('1')], null, false)
      useMessageStore.getState().addMessage(makeMessage('2'))

      const { messages } = useMessageStore.getState()
      expect(messages[0].id).toBe('2')
      expect(messages[1].id).toBe('1')
    })
  })

  describe('updateMessage', () => {
    it('対象IDのメッセージのみ更新される（他は変更なし）', () => {
      const msg1 = makeMessage('1')
      const msg2 = makeMessage('2')
      useMessageStore.getState().setMessages([msg1, msg2], null, false)

      const updated = { ...msg2, content: 'Updated' }
      useMessageStore.getState().updateMessage(updated)

      const { messages } = useMessageStore.getState()
      expect(messages.find((m) => m.id === '2')?.content).toBe('Updated')
      expect(messages.find((m) => m.id === '1')?.content).toBe('Message 1')
    })

    it('存在しないIDの更新はリストを変更しない', () => {
      useMessageStore.getState().setMessages([makeMessage('1')], null, false)
      useMessageStore.getState().updateMessage(makeMessage('non-existent'))

      const { messages } = useMessageStore.getState()
      expect(messages).toHaveLength(1)
    })
  })

  describe('removeMessage', () => {
    it('対象IDのメッセージがリストから除去される', () => {
      useMessageStore.getState().setMessages([makeMessage('1'), makeMessage('2')], null, false)
      useMessageStore.getState().removeMessage('1')

      const { messages } = useMessageStore.getState()
      expect(messages).toHaveLength(1)
      expect(messages[0].id).toBe('2')
    })
  })

  describe('prependMessages', () => {
    it('古いメッセージがリストの末尾に追加される（無限スクロール用）', () => {
      useMessageStore.getState().setMessages([makeMessage('new')], 'cursor-1', true)

      const olderMessages = [makeMessage('old1'), makeMessage('old2')]
      useMessageStore.getState().prependMessages(olderMessages, null, false)

      const { messages, hasMore, nextCursor } = useMessageStore.getState()
      expect(messages[0].id).toBe('new')
      expect(messages[1].id).toBe('old1')
      expect(messages[2].id).toBe('old2')
      expect(hasMore).toBe(false)
      expect(nextCursor).toBeNull()
    })
  })

  describe('reset', () => {
    it('すべての状態を初期値にリセットする', () => {
      useMessageStore.getState().setMessages([makeMessage('1')], 'cursor', true)
      useMessageStore.getState().reset()

      const { messages, nextCursor, hasMore, isLoading } = useMessageStore.getState()
      expect(messages).toHaveLength(0)
      expect(nextCursor).toBeNull()
      expect(hasMore).toBe(false)
      expect(isLoading).toBe(false)
    })
  })
})
