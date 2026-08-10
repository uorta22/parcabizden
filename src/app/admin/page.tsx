'use client'

/**
 * Yönetim panosu — pazaryeri odaklı.
 *
 * Önceki sürüm ürün ve sipariş sayısı gösteriyordu; ikisi de tek satıcılı
 * e-ticaret modelinin kalıntısıydı ve pazaryerinde karşılıkları yok.
 * Burada yalnızca gerçekten ölçebildiğimiz şey var: onay bekleyen başvurular.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Store, Clock, ArrowRight } from 'lucide-react'
import { adminSellerList } from '@/lib/api'

export default function AdminDashboard() {
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminSellerList('pending')
      .then(res => setPendingCount(res.sellers.length))
      .catch(() => setError('Başvurular yüklenemedi'))
  }, [])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/saticilar"
          className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {pendingCount === null
                  ? <span className="inline-block h-7 w-8 animate-pulse rounded bg-gray-100" />
                  : pendingCount}
              </p>
              <p className="text-sm text-gray-500">Onay Bekleyen Başvuru</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/saticilar"
          className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
              <Store className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                Satıcıları Yönet <ArrowRight className="h-3.5 w-3.5" />
              </p>
              <p className="text-sm text-gray-500">Onayla, reddet, askıya al</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
