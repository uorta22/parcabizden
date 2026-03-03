'use client'

import { useState, useEffect } from 'react'
import { Heart, Trash2 } from 'lucide-react'
import { favoriteList, favoriteRemove } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import type { ShopProduct } from '@/types/shop'

export default function FavorilerPage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    favoriteList()
      .then((res) => {
        setProducts(res.products)
        // Build productId -> favoriteId map for removal
        const map: Record<string, number> = {}
        for (const fav of res.favorites) {
          map[String(fav.product_id)] = fav.id
        }
        setFavoriteIds(map)
      })
      .catch(() => setError('Favoriler yüklenemedi. Lütfen tekrar deneyin.'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleRemove = async (productId: string | number) => {
    const pid = String(productId)
    setRemoving(pid)
    try {
      await favoriteRemove(pid)
      setProducts((prev) => prev.filter((p) => String(p.id) !== pid))
      setFavoriteIds((prev) => {
        const next = { ...prev }
        delete next[pid]
        return next
      })
    } catch {
      // silently fail
    } finally {
      setRemoving(null)
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
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Favori Ürününüz Yok</h2>
          <p className="text-gray-500 mb-6">
            Ürün sayfalarındaki kalp ikonuna tıklayarak favorilerinize ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => {
            const pid = String(product.id)
            const isRemoving = removing === pid
            return (
              <div key={pid} className="relative group">
                <ProductCard product={product} />
                {/* Remove button overlay */}
                <button
                  onClick={() => handleRemove(pid)}
                  disabled={isRemoving}
                  title="Favorilerden çıkar"
                  className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-red-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                  {isRemoving ? (
                    <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
