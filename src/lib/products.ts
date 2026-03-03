import type { ShopProduct } from '@/types/shop'

let cachedProducts: ShopProduct[] | null = null

export async function loadProducts(): Promise<ShopProduct[]> {
  if (cachedProducts) return cachedProducts
  try {
    const res = await fetch('/data/products.json')
    if (!res.ok) return []
    const data: ShopProduct[] = await res.json()
    cachedProducts = data
    return data
  } catch {
    return []
  }
}

export async function getProductBySlug(slug: string): Promise<ShopProduct | null> {
  const products = await loadProducts()
  return products.find(p => p.slug === slug) || null
}

export async function getProductByOem(oem: string): Promise<ShopProduct | null> {
  const products = await loadProducts()
  const oemNorm = oem.replace(/[\s\-]/g, '').toUpperCase()
  return products.find(p => {
    if (!p.oem_number) return false
    return p.oem_number.replace(/[\s\-]/g, '').toUpperCase() === oemNorm
  }) || null
}

export async function searchProducts(query: string): Promise<ShopProduct[]> {
  const products = await loadProducts()
  if (!query.trim()) return products

  const q = query.toLowerCase()
  return products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    (p.oem_number && p.oem_number.toLowerCase().includes(q)) ||
    (p.brand_name && p.brand_name.toLowerCase().includes(q)) ||
    (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
    p.category.toLowerCase().includes(q)
  )
}

export function getProductsByCategory(products: ShopProduct[], category: string): ShopProduct[] {
  return products.filter(p => p.category === category)
}

export function formatPrice(price: number): string {
  return price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 })
}
