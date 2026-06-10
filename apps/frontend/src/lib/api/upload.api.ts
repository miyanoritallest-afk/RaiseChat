const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api`

export type UploadResult = {
  s3Key: string
  fileType: 'IMAGE' | 'VIDEO'
  fileName: string
  fileSize: number
}

export async function uploadFile(wsId: string, file: File): Promise<UploadResult> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}/workspaces/${wsId}/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    // Content-Type は FormData が自動設定するため手動設定しない
  })

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    throw new Error('認証が必要です')
  }

  if (!response.ok) {
    const error = (await response
      .json()
      .catch(() => ({ message: 'アップロードに失敗しました' }))) as {
      message: string | string[]
    }
    const message = Array.isArray(error.message) ? error.message.join(', ') : error.message
    throw new Error(message)
  }

  return response.json() as Promise<UploadResult>
}
