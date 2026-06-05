import type { Metadata } from 'next'
import { WorkspaceList } from '@/components/workspace/WorkspaceList'

export const metadata: Metadata = {
  title: 'ワークスペース | RaiseChat',
}

export default function WorkspacesPage() {
  return <WorkspaceList />
}
