'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, ChevronRight } from 'lucide-react'
import { fetchAutodataBrands } from '@/lib/api'

function getBrandLogo(slug: string): string {
  return `/brands/${slug}.webp`
}

export default function PopularBrands() {
  const [brands, setBrands] = useState<{ name: string; slug: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAutodataBrands()
      .then(data => setBrands(data.brands || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (brands.length === 0) return null

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {brands.map(b => (
          <Link
            key={b.slug}
            href={`/parcalar?brand=${b.slug}&marka=${encodeURIComponent(b.name)}`}
            className="group flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all"
          >
            <Image src={getBrandLogo(b.slug)} alt={b.name} width={48} height={48} className="object-contain" loading="lazy" />
            <span className="text-xs text-gray-700 font-medium text-center group-hover:text-primary-600 transition-colors">{b.name}</span>
          </Link>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link
          href="/parcalar"
          className="inline-flex items-center gap-2 px-6 py-3 border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white rounded-lg transition-all font-medium"
        >
          Tüm Parçaları Gör
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  )
}
