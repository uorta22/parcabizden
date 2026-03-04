import type { ShopProduct } from '@/types/shop'
import { productList, productDetail, productSearch as apiProductSearch } from '@/lib/api'

export async function fetchProducts(params?: {
  category?: string
  search?: string
  brand?: string
  vehicle_id?: number
  page?: number
  per_page?: number
}): Promise<{ products: ShopProduct[]; total: number; page: number; per_page: number }> {
  try {
    return await productList(params)
  } catch {
    return { products: [], total: 0, page: 1, per_page: 20 }
  }
}

export async function fetchProductDetail(slug: string): Promise<ShopProduct | null> {
  try {
    const res = await productDetail(slug)
    return res.product
  } catch {
    return null
  }
}

export async function searchProducts(query: string): Promise<ShopProduct[]> {
  try {
    const res = await apiProductSearch(query)
    return res.products
  } catch {
    return []
  }
}

export async function getProductByOem(oem: string): Promise<ShopProduct | null> {
  try {
    const res = await apiProductSearch(oem)
    const match = res.products.find(
      (p: ShopProduct) => p.oem_number === oem || p.name.includes(oem)
    )
    return match || null
  } catch {
    return null
  }
}

export function formatPrice(price: number): string {
  return price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 })
}
