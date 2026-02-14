'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            Bir Hata Oluştu
          </h1>

          <p className="text-gray-400 mb-8">
            Beklenmeyen bir hata meydana geldi. Lütfen sayfayı yenileyin veya
            ana sayfaya dönün.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-dark-900 font-semibold rounded-lg transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              Tekrar Dene
            </button>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 border border-dark-600 text-gray-300 hover:text-white hover:border-dark-500 rounded-lg transition-all"
            >
              <Home className="w-5 h-5" />
              Ana Sayfa
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
