'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, ChevronRight, Loader2, Package, SlidersHorizontal } from 'lucide-react'
import { loadProducts, searchProducts, getProductsByCategory } from '@/lib/products'
import { CategoryIcon, getCategoryColor } from '@/components/CategoryIcons'
import ProductCard from '@/components/ProductCard'
import type { ShopProduct } from '@/types/shop'

const CATEGORIES = [
  { id: 'engine', name: 'Motor' },
  { id: 'turbo_intake', name: 'Turbo & Emme' },
  { id: 'fuel', name: 'Yakıt Sistemi' },
  { id: 'exhaust', name: 'Egzoz' },
  { id: 'transmission', name: 'Şanzıman' },
  { id: 'brake', name: 'Fren' },
  { id: 'suspension', name: 'Süspansiyon' },
  { id: 'wheel_tyre', name: 'Jant & Lastik' },
  { id: 'body_exterior', name: 'Kaporta & Dış' },
  { id: 'glass_mirror', name: 'Cam & Ayna' },
  { id: 'lighting', name: 'Aydınlatma' },
  { id: 'electrical', name: 'Elektrik' },
  { id: 'climate', name: 'Klima & Isıtma' },
  { id: 'interior', name: 'İç Aksam' },
  { id: 'audio_media', name: 'Ses & Medya' },
  { id: 'tow_transport', name: 'Çeki & Taşıma' },
  { id: 'other', name: 'Diğer' },
]

type SortOption = 'default' | 'price_asc' | 'price_desc'

function UrunlerContent() {
  const searchParams = useSearchParams()
  const qParam = searchParams.get('q') || ''
  const catParam = searchParams.get('cat') || ''
  const brandParam = searchParams.get('brand') || ''

  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(qParam)
  const [activeCategory, setActiveCategory] = useState(catParam)
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setLoading(true)
    loadProducts()
      .then(data => setProducts(data))
      .finally(() => setLoading(false))
  }, [])

  // Update search from URL params
  useEffect(() => {
    if (qParam) setSearchQuery(qParam)
    if (catParam) setActiveCategory(catParam)
  }, [qParam, catParam])

  const filteredProducts = useMemo(() => {
    let result = products

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.oem_number && p.oem_number.toLowerCase().includes(q)) ||
        (p.brand_name && p.brand_name.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
        p.description.toLowerCase().includes(q)
      )
    }

    // Category filter
    if (activeCategory) {
      result = getProductsByCategory(result, activeCategory)
    }

    // Brand filter from URL
    if (brandParam) {
      result = result.filter(p =>
        p.compatible_vehicles?.some(v => v.brand_slug === brandParam)
      )
    }

    // Sort
    if (sortBy === 'price_asc') {
      result = [...result].sort((a, b) => {
        const pa = a.discount_price || a.price || Infinity
        const pb = b.discount_price || b.price || Infinity
        return pa - pb
      })
    } else if (sortBy === 'price_desc') {
      result = [...result].sort((a, b) => {
        const pa = a.discount_price || a.price || 0
        const pb = b.discount_price || b.price || 0
        return pb - pa
      })
    }

    return result
  }, [products, searchQuery, activeCategory, brandParam, sortBy])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of products) {
      counts[p.category] = (counts[p.category] || 0) + 1
    }
    return counts
  }, [products])

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Ürünler</span>
          {activeCategory && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-primary-500">{CATEGORIES.find(c => c.id === activeCategory)?.name || activeCategory}</span>
            </>
          )}
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar — Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Search */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">Ara</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Ürün adı, OEM..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-400 transition-colors"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">Kategoriler</label>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveCategory('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      !activeCategory ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Tümü ({products.length})
                  </button>
                  {CATEGORIES.filter(c => categoryCounts[c.id]).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                        activeCategory === cat.id ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <CategoryIcon id={cat.id} className={activeCategory === cat.id ? 'text-primary-500' : 'text-gray-400'} size={16} stroke={2} />
                      <span className="flex-1">{cat.name}</span>
                      <span className="text-xs text-gray-400">{categoryCounts[cat.id]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">Sıralama</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-primary-400 transition-colors"
                >
                  <option value="default">Varsayılan</option>
                  <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
                  <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter toggle */}
            <div className="lg:hidden mb-4 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ürün ara..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-400 transition-colors"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtre
              </button>
            </div>

            {/* Mobile filters */}
            {showFilters && (
              <div className="lg:hidden mb-4 bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveCategory('')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      !activeCategory ? 'bg-primary-500 text-dark-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tümü
                  </button>
                  {CATEGORIES.filter(c => categoryCounts[c.id]).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        activeCategory === cat.id ? 'bg-primary-500 text-dark-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700"
                >
                  <option value="default">Varsayılan Sıralama</option>
                  <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
                  <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
                </select>
              </div>
            )}

            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                {filteredProducts.length} ürün{searchQuery ? ` — "${searchQuery}"` : ''}
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            )}

            {/* Products Grid */}
            {!loading && filteredProducts.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Urun bulunamadi</h3>
                <p className="text-sm text-gray-500 mb-6">Arama kriterlerinize uygun urun bulunamadi.</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('') }}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-dark-900 font-semibold rounded-xl transition-colors text-sm"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UrunlerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <UrunlerContent />
    </Suspense>
  )
}
