'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    let dest = '/customer/dashboard'
    try {
      const raw = localStorage.getItem('auth-storage')
      if (raw) {
        const parsed = JSON.parse(raw)
        const role = parsed?.state?.user?.user_type
        if (role === 'provider') dest = '/provider/dashboard'
        else if (role === 'admin') dest = '/admin/dashboard'
      }
    } catch {
      dest = '/auth/login'
    }
    router.replace(dest)
  }, [router])

  return null
}
