'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function GarajRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/hesabim/garaj')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
