'use client'

import { useEffect, useState, useMemo, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, ChevronRight, ChevronLeft, Loader2, Package, SlidersHorizontal, Car } from 'lucide-react'
import { fetchProducts } from '@/lib/products'
import { CategoryIcon } from '@/components/CategoryIcons'
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

const PER_PAGE = 24

type SortOption = 'default' | 'price_asc' | 'price_desc'

function UrunlerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const qParam = searchParams.get('q') || ''
  const catParam = searchParams.get('cat') || ''
  const brandParam = searchParams.get('brand') || ''
  const vehicleParam = searchParams.get('vehicle') || ''
  const pageParam = parseInt(searchParams.get('page') || '1', 10)

  const [products, setProducts] = useState<ShopProduct[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(qParam)
  const [activeCategory, setActiveCategory] = useState(catParam)
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(pageParam)
  const [debouncedSearch, setDebouncedSearch] = useState(qParam)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery])

  // Sync URL params to local state
  useEffect(() => {
    if (qParam) { setSearchQuery(qParam); setDebouncedSearch(qParam) }
    if (catParam) setActiveCategory(catParam)
  }, [qParam, catParam])

  // Fetch products when filters change
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchProducts({
      category: activeCategory || undefined,
      search: debouncedSearch.trim() || undefined,
      brand: brandParam || undefined,
      vehicle_id: vehicleParam ? parseInt(vehicleParam) : undefined,
      page: currentPage,
      per_page: PER_PAGE,
    }).then(res => {
      if (cancelled) return
      setProducts(res.products)
      setTotal(res.total)
    }).catch(() => {
      if (cancelled) return
      setProducts([])
      setTotal(0)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [activeCategory, debouncedSearch, brandParam, vehicleParam, currentPage])

  const totalPages = Math.ceil(total / PER_PAGE)

  const sortedProducts = useMemo(() => {
    if (sortBy === 'default') return products
    return [...products].sort((a, b) => {
      const pa = a.discount_price || a.price || (sortBy === 'price_asc' ? Infinity : 0)
      const pb = b.discount_price || b.price || (sortBy === 'price_asc' ? Infinity : 0)
      return sortBy === 'price_asc' ? pa - pb : pb - pa
    })
  }, [products, sortBy])

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat)
    setCurrentPage(1)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    setDebouncedSearch(searchQuery)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Ürünler</span>
          {activeCategory && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-primary-500">{CATEGORIES.find(c => c.id === activeCategory)?.name || activeCategory}</span>
            </>
          )}
          {vehicleParam && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-primary-500 flex items-center gap-1"><Car className="w-3.5 h-3.5" /> Araç Filtreli</span>
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
                <form onSubmit={handleSearchSubmit}>
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
                </form>
              </div>

              {/* Vehicle filter indicator */}
              {vehicleParam && (
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Car className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-medium text-primary-700">Araç Filtresi Aktif</span>
                  </div>
                  <p className="text-xs text-primary-600">Garajınızdaki araçla uyumlu ürünler gösteriliyor.</p>
                  <button
                    onClick={() => router.push('/urunler')}
                    className="text-xs text-primary-500 hover:text-primary-700 font-medium mt-1"
                  >
                    Filtreyi Kaldır
                  </button>
                </div>
              )}

              {/* Categories */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">Kategoriler</label>
                <div className="space-y-1">
                  <button
                    onClick={() => handleCategoryChange('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      !activeCategory ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Tümü
                  </button>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(activeCategory === cat.id ? '' : cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                        activeCategory === cat.id ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <CategoryIcon id={cat.id} className={activeCategory === cat.id ? 'text-primary-500' : 'text-gray-400'} size={16} stroke={2} />
                      <span className="flex-1">{cat.name}</span>
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
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ürün ara..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-400 transition-colors"
                />
              </form>
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
                    onClick={() => handleCategoryChange('')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      !activeCategory ? 'bg-primary-500 text-dark-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tümü
                  </button>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(activeCategory === cat.id ? '' : cat.id)}
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
                {total} ürün{searchQuery ? ` — "${searchQuery}"` : ''}
              </p>
              {totalPages > 1 && (
                <p className="text-sm text-gray-400">Sayfa {currentPage} / {totalPages}</p>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            )}

            {/* Products Grid */}
            {!loading && sortedProducts.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number
                  if (totalPages <= 5) {
                    page = i + 1
                  } else if (currentPage <= 3) {
                    page = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i
                  } else {
                    page = currentPage - 2 + i
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        page === currentPage
                          ? 'bg-primary-500 text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && sortedProducts.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ürün bulunamadı</h3>
                <p className="text-sm text-gray-500 mb-6">Arama kriterlerinize uygun ürün bulunamadı.</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory(''); setCurrentPage(1) }}
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
