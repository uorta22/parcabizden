'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import * as api from '@/lib/api'
import type { ShopProduct } from '@/types/shop'
import ProductForm from '../ProductForm'

export default function EditProductPage() {
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<ShopProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        // Fetch all products and find by id since we don't have a get-by-id endpoint
        const res = await api.productList({ per_page: 100 })
        const found = res.products.find(p => String(p.id) === id)
        if (found) {
          // Get full detail via slug
          const detail = await api.productDetail(found.slug)
          setProduct(detail.product)
        } else {
          setError('Ürün bulunamadı')
        }
      } catch {
        setError('Ürün yüklenemedi')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 font-medium">{error || 'Ürün bulunamadı'}</p>
      </div>
    )
  }

  return <ProductForm product={product} isEdit />
}
