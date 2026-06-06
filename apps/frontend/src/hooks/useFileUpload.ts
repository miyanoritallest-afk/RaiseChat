'use client'

import { useCallback, useState } from 'react'
import { uploadFile, type UploadResult } from '@/lib/api/upload.api'

export type PendingAttachment = {
  file: File
  previewUrl: string
  result: UploadResult | null
  error: string | null
  isUploading: boolean
}

export function useFileUpload(wsId: string) {
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])

  const addFile = useCallback(
    async (file: File) => {
      const previewUrl = URL.createObjectURL(file)
      const pending: PendingAttachment = {
        file,
        previewUrl,
        result: null,
        error: null,
        isUploading: true,
      }

      setAttachments((prev) => [...prev, pending])

      try {
        const result = await uploadFile(wsId, file)
        setAttachments((prev) =>
          prev.map((a) => (a.previewUrl === previewUrl ? { ...a, result, isUploading: false } : a)),
        )
      } catch (e) {
        const error = e instanceof Error ? e.message : 'アップロードに失敗しました'
        setAttachments((prev) =>
          prev.map((a) => (a.previewUrl === previewUrl ? { ...a, error, isUploading: false } : a)),
        )
      }
    },
    [wsId],
  )

  const removeFile = useCallback((previewUrl: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.previewUrl === previewUrl)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((a) => a.previewUrl !== previewUrl)
    })
  }, [])

  const reset = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach((a) => URL.revokeObjectURL(a.previewUrl))
      return []
    })
  }, [])

  const readyAttachments = attachments
    .filter((a) => a.result !== null && !a.error)
    .map((a) => a.result!)

  return { attachments, addFile, removeFile, reset, readyAttachments }
}
