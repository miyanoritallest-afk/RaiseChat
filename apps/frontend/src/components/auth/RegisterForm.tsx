'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  username: z
    .string()
    .min(3, '3文字以上で入力してください')
    .max(20, '20文字以内で入力してください')
    .regex(/^[a-zA-Z0-9_]+$/, '英数字・アンダースコアのみ使用できます'),
  displayName: z
    .string()
    .min(1, '表示名を入力してください')
    .max(50, '50文字以内で入力してください'),
  password: z.string().min(8, '8文字以上で入力してください'),
})

type FormData = z.infer<typeof schema>

export function RegisterForm() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setErrorMessage(null)
    try {
      const res = await authApi.register(data)
      setAuth(res.user, res.token)
      router.push('/login')
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '登録に失敗しました')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">アカウント登録</h1>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label>
          <Input
            {...register('username')}
            placeholder="例: john_doe"
            aria-invalid={!!errors.username}
          />
          {errors.username && (
            <p className="mt-1 text-xs text-destructive flex items-center gap-1">
              <span>⚠</span> {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
          <Input
            {...register('displayName')}
            placeholder="例: John Doe"
            aria-invalid={!!errors.displayName}
          />
          {errors.displayName && (
            <p className="mt-1 text-xs text-destructive flex items-center gap-1">
              <span>⚠</span> {errors.displayName.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
          <Input
            {...register('password')}
            type="password"
            placeholder="8文字以上"
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-destructive flex items-center gap-1">
              <span>⚠</span> {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
          {isSubmitting ? '登録中...' : '登録する'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        すでにアカウントをお持ちですか？{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  )
}
