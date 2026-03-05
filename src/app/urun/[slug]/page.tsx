'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { fetchProductDetail } from '@/lib/products'

/**
 * /urun/{slug} artık /parca/{oem} sayfasına yönlendirir.
 * OEM numarası olan ürünler tek bir detay sayfasında birleştirildi.
 */
export default function ProductRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchProductDetail(slug)
      .then(product => {
        if (product?.oem_number) {
          router.replace(`/parca/${encodeURIComponent(product.oem_number)}`)
        } else {
          // OEM numarası yok — ana sayfaya yönlendir
          setError(true)
          setTimeout(() => router.replace('/parcalar'), 2000)
        }
      })
      .catch(() => {
        setError(true)
        setTimeout(() => router.replace('/parcalar'), 2000)
      })
  }, [slug, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      {error ? (
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-2">Ürün bulunamadı, yönlendiriliyorsunuz...</p>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          <span className="text-gray-500 text-sm">Yönlendiriliyor...</span>
        </div>
      )}
    </div>
  )
}
