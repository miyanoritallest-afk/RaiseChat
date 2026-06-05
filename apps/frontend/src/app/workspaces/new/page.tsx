import type { Metadata } from 'next'
import { CreateWorkspaceForm } from '@/components/workspace/CreateWorkspaceForm'

export const metadata: Metadata = {
  title: 'ワークスペースを作成 | RaiseChat',
}

export default function NewWorkspacePage() {
  return <CreateWorkspaceForm />
}
