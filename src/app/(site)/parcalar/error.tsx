'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react'

export default function ParcalarError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Parts page error:', error)
  }, [error])

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Parçalar</span>
        </nav>

        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Parçalar Yüklenemedi
          </h1>

          <p className="text-gray-500 mb-6">
            Parça bilgileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
          </p>

          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Tekrar Dene
          </button>
        </div>
      </div>
    </div>
  )
}
