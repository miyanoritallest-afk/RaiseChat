'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'

export function AuthInitializer() {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return null
}
