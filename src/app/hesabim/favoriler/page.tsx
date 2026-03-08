'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { favoriteList, favoriteRemove } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import EmptyState from '@/components/EmptyState'
import type { ShopProduct } from '@/types/shop'

export default function FavorilerPage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    favoriteList()
      .then((res) => {
        setProducts(res.products)
      })
      .catch(() => setError('Favoriler yüklenemedi. Lütfen tekrar deneyin.'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleRemove = async (productId: string | number) => {
    const pid = String(productId)
    try {
      await favoriteRemove(pid)
      setProducts((prev) => prev.filter((p) => String(p.id) !== pid))
    } catch {
      // silently fail
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Favori Ürünlerim</h1>
        <p className="text-gray-500 text-sm">
          {products.length > 0
            ? `${products.length} favori ürününüz var`
            : 'Beğendiğiniz ürünleri buraya ekleyin'}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4">
          {error}
        </div>
      )}

      {!error && products.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-10 h-10" />}
          title="Favori Ürününüz Yok"
          description="Ürün sayfalarındaki kalp ikonuna tıklayarak favorilerinize ekleyebilirsiniz."
          action={{ label: 'Ürünlere Göz At', href: '/urunler' }}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={String(product.id)} product={product} onRemoveFavorite={handleRemove} />
          ))}
        </div>
      )}
    </div>
  )
}
