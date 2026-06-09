'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { DmMessageList } from '@/components/dm/DmMessageList'
import { DmMessageInput } from '@/components/dm/DmMessageInput'
import { useDmStore } from '@/stores/dm.store'
import { useDm } from '@/hooks/useDm'
import { useDmSocket } from '@/hooks/useDmSocket'
import { dmApi } from '@/lib/api/dm.api'
import { getDmRoomDisplayName } from '@/types/dm'
import { useAuthStore } from '@/stores/auth.store'

export default function DmPage() {
  const params = useParams<{ workspaceId: string; dmRoomId: string }>()
  const { user } = useAuthStore()
  const { currentRoom, setCurrentRoom, reset } = useDmStore()
  const { isLoading, hasMore, loadMore } = useDm(params.dmRoomId)
  const socket = useDmSocket(params.dmRoomId)

  // DM部屋の情報を取得
  useEffect(() => {
    dmApi
      .getDmRooms(params.workspaceId)
      .then((rooms) => {
        const room = rooms.find((r) => r.id === params.dmRoomId)
        if (room) setCurrentRoom(room)
      })
      .catch(() => {})
  }, [params.workspaceId, params.dmRoomId, setCurrentRoom])

  // ページ離脱時にリセット
  useEffect(() => {
    return () => reset()
  }, [params.dmRoomId, reset])

  const displayName = currentRoom && user ? getDmRoomDisplayName(currentRoom, user.id) : '...'

  return (
    <AppLayout workspaceId={params.workspaceId}>
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
          <span className="text-gray-400">{currentRoom?.isGroup ? '👥' : '@'}</span>
          <span className="font-semibold text-gray-900">{displayName}</span>
          {currentRoom?.isGroup && (
            <div className="flex items-center gap-0.5 ml-1">
              {currentRoom.members
                .filter((m) => m.userId !== user?.id)
                .slice(0, 5)
                .map((m) => (
                  <div
                    key={m.userId}
                    className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold border border-white"
                    title={m.user.displayName}
                  >
                    {m.user.displayName.charAt(0).toUpperCase()}
                  </div>
                ))}
            </div>
          )}
        </div>
        <DmMessageList hasMore={hasMore} isLoading={isLoading} loadMore={loadMore} />
        {currentRoom && <DmMessageInput room={currentRoom} socket={socket} />}
      </div>
    </AppLayout>
  )
}
