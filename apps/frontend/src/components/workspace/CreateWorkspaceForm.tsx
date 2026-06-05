'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { workspaceApi } from '@/lib/api/workspace.api'
import { useWorkspaceStore } from '@/stores/workspace.store'

const schema = z.object({
  name: z
    .string()
    .min(1, 'ワークスペース名を入力してください')
    .max(50, '50文字以内で入力してください'),
  description: z.string().max(200, '200文字以内で入力してください').optional(),
})

type FormData = z.infer<typeof schema>

export function CreateWorkspaceForm() {
  const router = useRouter()
  const { addWorkspace } = useWorkspaceStore()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setErrorMessage(null)
    try {
      const workspace = await workspaceApi.createWorkspace(data)
      addWorkspace(workspace)
      router.push('/workspaces')
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'ワークスペースの作成に失敗しました')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg border border-gray-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">ワークスペースを作成</h1>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ワークスペース名 <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="例: my-team"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明（任意）</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="ワークスペースの説明を入力"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors"
          >
            {isSubmitting ? '作成中...' : '作成する'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          <Link href="/workspaces" className="text-blue-600 hover:underline">
            ← ワークスペース一覧に戻る
          </Link>
        </p>
      </div>
    </div>
  )
}
