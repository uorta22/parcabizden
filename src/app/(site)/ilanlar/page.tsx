'use client'

/**
 * İlan arama/listeleme sayfası — alıcılar satıcı ilanlarını burada arar.
 *
 * Filtreler URL query string'inde tutulur (paylaşılabilir link + geri tuşu
 * çalışır). `useSearchParams` Next.js 14'te Suspense sınırı gerektirdiği için
 * sayfa dışarıda bir Suspense ile sarmalanır, asıl mantık içerideki bileşende.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search, SlidersHorizontal, X, MapPin, Store, ShieldCheck,
  PackageSearch, ImageOff, AlertCircle, ArrowRight,
} from 'lucide-react'
import Pagination from '@/components/Pagination'
import EmptyState from '@/components/EmptyState'
import { Skeleton } from '@/components/Skeleton'
import { getTecBrands, getTecModels, type TecBrand, type TecModel } from '@/lib/tecdoc'
import { fetchCities, type GeoCity } from '@/lib/api'
import {
  searchListings,
  type ListingCard as ListingCardData,
  type ListingConditionType,
  type ListingSortOption,
} from '@/lib/listing-search'
import { siteConfig } from '@/lib/config'

const PER_PAGE = 24
const TALEP_URL = siteConfig.surfaces.request

const CONDITION_OPTIONS: Array<{ value: ListingConditionType; label: string }> = [
  { value: 'cikma', label: 'Çıkma' },
  { value: 'sifir', label: 'Sıfır' },
  { value: 'yenilenmis', label: 'Yenilenmiş' },
]

const SORT_OPTIONS: Array<{ value: ListingSortOption; label: string }> = [
  { value: 'newest', label: 'En Yeni' },
  { value: 'price_asc', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'price_desc', label: 'Fiyat: Yüksekten Düşüğe' },
]

const FILTER_KEYS = ['q', 'manufacturer_id', 'model_id', 'city_id', 'condition_type', 'price_min', 'price_max']

export default function IlanlarPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <IlanlarInner />
    </Suspense>
  )
}

function PageSkeleton() {
  return (
    <main className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Skeleton className="hidden h-96 lg:block" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    </main>
  )
}

function IlanlarInner() {
  const router = useRouter()
  const sp = useSearchParams()

  const manufacturerId = sp.get('manufacturer_id') ? parseInt(sp.get('manufacturer_id')!, 10) : null
  const modelId         = sp.get('model_id') ? parseInt(sp.get('model_id')!, 10) : null
  const cityId          = sp.get('city_id') ? parseInt(sp.get('city_id')!, 10) : null
  const conditionType    = sp.get('condition_type') as ListingConditionType | null
  const sort             = (sp.get('sort') as ListingSortOption | null) ?? 'newest'
  const page              = sp.get('page') ? Math.max(1, parseInt(sp.get('page')!, 10)) : 1

  const hasActiveFilters = FILTER_KEYS.some(k => !!sp.get(k))

  // ── Filtre kaynak verileri ──
  const [brands, setBrands] = useState<TecBrand[]>([])
  const [models, setModels] = useState<TecModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [cities, setCities] = useState<GeoCity[]>([])

  useEffect(() => {
    getTecBrands().then(setBrands).catch(() => setBrands([]))
    fetchCities().then(r => setCities(r.cities)).catch(() => setCities([]))
  }, [])

  useEffect(() => {
    if (!manufacturerId) { setModels([]); return }
    setModelsLoading(true)
    getTecModels(manufacturerId)
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false))
  }, [manufacturerId])

  // ── Serbest metin / fiyat taslakları — URL'e her tuşta değil, onaylanınca yazılır ──
  const [searchDraft, setSearchDraft]     = useState(sp.get('q') ?? '')
  const [priceMinDraft, setPriceMinDraft] = useState(sp.get('price_min') ?? '')
  const [priceMaxDraft, setPriceMaxDraft] = useState(sp.get('price_max') ?? '')

  useEffect(() => {
    setSearchDraft(sp.get('q') ?? '')
    setPriceMinDraft(sp.get('price_min') ?? '')
    setPriceMaxDraft(sp.get('price_max') ?? '')
  }, [sp])

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // ── URL güncelleme ──
  // Filtre değişince sayfa 1'e döner; sadece sayfa değişiminde page korunur/atlanmaz.
  const updateFilters = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(sp.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    params.delete('page')
    router.push(`/ilanlar?${params.toString()}`)
  }, [router, sp])

  const goToPage = useCallback((nextPage: number) => {
    const params = new URLSearchParams(sp.toString())
    if (nextPage <= 1) params.delete('page')
    else params.set('page', String(nextPage))
    router.push(`/ilanlar?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [router, sp])

  const clearFilters = useCallback(() => router.push('/ilanlar'), [router])

  // ── İlan arama ──
  const [result, setResult] = useState<{ listings: ListingCardData[]; total: number; per_page: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    searchListings({
      q: sp.get('q') || undefined,
      manufacturer_id: manufacturerId ?? undefined,
      model_id: modelId ?? undefined,
      city_id: cityId ?? undefined,
      condition_type: conditionType ?? undefined,
      price_min: sp.get('price_min') ? Number(sp.get('price_min')) : undefined,
      price_max: sp.get('price_max') ? Number(sp.get('price_max')) : undefined,
      sort,
      page,
      per_page: PER_PAGE,
    })
      .then(res => { if (!cancelled) setResult(res) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'İlanlar yüklenemedi') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [sp]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = useMemo(() => {
    if (!result) return 1
    return Math.max(1, Math.ceil(result.total / (result.per_page || PER_PAGE)))
  }, [result])

  const selectedBrand = brands.find(b => b.id === manufacturerId)

  const filterProps: FilterPanelProps = {
    brands, models, modelsLoading, cities,
    manufacturerId, modelId, cityId, conditionType,
    searchDraft, priceMinDraft, priceMaxDraft,
    onSearchDraftChange: setSearchDraft,
    onPriceMinDraftChange: setPriceMinDraft,
    onPriceMaxDraftChange: setPriceMaxDraft,
    onSearchSubmit: () => updateFilters({ q: searchDraft.trim() || undefined }),
    onPriceApply: () => updateFilters({ price_min: priceMinDraft.trim() || undefined, price_max: priceMaxDraft.trim() || undefined }),
    onBrandChange: id => updateFilters({ manufacturer_id: id || undefined, model_id: undefined }),
    onModelChange: id => updateFilters({ model_id: id || undefined }),
    onCityChange: id => updateFilters({ city_id: id || undefined }),
    onConditionChange: value => updateFilters({ condition_type: value || undefined }),
    hasActiveFilters,
    onClear: clearFilters,
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* ── Başlık + sıralama + mobil filtre butonu ── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 md:text-3xl">
              İlanlarda <span className="text-primary-500">Ara</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {result ? <><span className="font-semibold text-gray-700">{result.total.toLocaleString('tr-TR')}</span> ilan bulundu</> : 'Satıcı ilanları listeleniyor'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-primary-400 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filtrele
            </button>
            <select
              value={sort}
              onChange={e => updateFilters({ sort: e.target.value === 'newest' ? undefined : e.target.value })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-primary-500"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* ── Masaüstü: yan sütun filtre paneli ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-5">
              <FilterPanel {...filterProps} />
            </div>
          </aside>

          {/* ── Mobil: açılır panel ── */}
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilterOpen(false)} />
              <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Filtrele</h2>
                  <button onClick={() => setMobileFilterOpen(false)} aria-label="Kapat" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <FilterPanel {...filterProps} />
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="mt-5 w-full rounded-xl bg-primary-500 py-3 text-sm font-bold text-white hover:bg-primary-600"
                >
                  Sonuçları Göster
                </button>
              </div>
            </div>
          )}

          {/* ── Sonuçlar ── */}
          <section>
            {selectedBrand && (
              <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-full bg-primary-500 px-3 py-1 font-semibold text-white">
                  {selectedBrand.name}{models.find(m => m.id === modelId) ? ` · ${models.find(m => m.id === modelId)!.name}` : ''}
                </span>
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span><strong>İlanlar yüklenemedi:</strong> {error}</span>
              </div>
            )}

            {loading && <ListingGridSkeleton />}

            {!loading && !error && result && result.listings.length === 0 && (
              hasActiveFilters ? (
                <EmptyState
                  icon={<PackageSearch className="h-8 w-8" />}
                  title="Aramanızla eşleşen ilan yok"
                  description="Filtreleri gevşetip tekrar deneyin — marka/model veya fiyat aralığını genişletmek genelde yeterli oluyor."
                  action={{ label: 'Filtreleri Temizle', onClick: clearFilters }}
                />
              ) : (
                <EmptyState
                  icon={<Store className="h-8 w-8" />}
                  title="Pazaryerinde henüz ilan yok"
                  description="ParcaBizden pazaryeri yeni açıldı, satıcılar ilan yayınladıkça burada listelenecek. Aradığınız parçayı hemen bulmak isterseniz talep açabilirsiniz — uygun satıcılar size teklif gönderir."
                  action={{ label: 'Talep Aç', href: TALEP_URL, icon: <ArrowRight className="h-4 w-4" /> }}
                />
              )
            )}

            {!loading && !error && result && result.listings.length > 0 && (
              <>
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {result.listings.map(listing => (
                    <li key={listing.id}>
                      <ListingGridCard listing={listing} />
                    </li>
                  ))}
                </ul>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={goToPage} />
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

// ═══════════════════════════════════════════════════════════
// Filtre Paneli
// ═══════════════════════════════════════════════════════════

interface FilterPanelProps {
  brands: TecBrand[]
  models: TecModel[]
  modelsLoading: boolean
  cities: GeoCity[]
  manufacturerId: number | null
  modelId: number | null
  cityId: number | null
  conditionType: ListingConditionType | null
  searchDraft: string
  priceMinDraft: string
  priceMaxDraft: string
  onSearchDraftChange: (v: string) => void
  onPriceMinDraftChange: (v: string) => void
  onPriceMaxDraftChange: (v: string) => void
  onSearchSubmit: () => void
  onPriceApply: () => void
  onBrandChange: (id: string | undefined) => void
  onModelChange: (id: string | undefined) => void
  onCityChange: (id: string | undefined) => void
  onConditionChange: (value: string | undefined) => void
  hasActiveFilters: boolean
  onClear: () => void
}

function FilterPanel({
  brands, models, modelsLoading, cities,
  manufacturerId, modelId, cityId, conditionType,
  searchDraft, priceMinDraft, priceMaxDraft,
  onSearchDraftChange, onPriceMinDraftChange, onPriceMaxDraftChange,
  onSearchSubmit, onPriceApply,
  onBrandChange, onModelChange, onCityChange, onConditionChange,
  hasActiveFilters, onClear,
}: FilterPanelProps) {
  return (
    <div className="space-y-5">
      {/* Serbest metin */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Ara</label>
        <form onSubmit={e => { e.preventDefault(); onSearchSubmit() }} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchDraft}
            onChange={e => onSearchDraftChange(e.target.value)}
            placeholder="Başlık, parça adı, OEM numarası…"
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </form>
      </div>

      {/* Marka */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Marka</label>
        <select
          value={manufacturerId ?? ''}
          onChange={e => onBrandChange(e.target.value || undefined)}
          className="w-full rounded-lg border border-gray-200 py-2.5 px-3 text-sm outline-none focus:border-primary-500"
        >
          <option value="">Tüm markalar</option>
          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Model — marka seçilince yüklenir */}
      {manufacturerId && (
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Model</label>
          <select
            value={modelId ?? ''}
            onChange={e => onModelChange(e.target.value || undefined)}
            disabled={modelsLoading}
            className="w-full rounded-lg border border-gray-200 py-2.5 px-3 text-sm outline-none focus:border-primary-500 disabled:opacity-50"
          >
            <option value="">{modelsLoading ? 'Yükleniyor…' : 'Tüm modeller'}</option>
            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      )}

      {/* Şehir */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Şehir</label>
        <select
          value={cityId ?? ''}
          onChange={e => onCityChange(e.target.value || undefined)}
          className="w-full rounded-lg border border-gray-200 py-2.5 px-3 text-sm outline-none focus:border-primary-500"
        >
          <option value="">Tüm şehirler</option>
          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Parça durumu */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Parça Durumu</label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onConditionChange(undefined)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${!conditionType ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}
          >
            Tümü
          </button>
          {CONDITION_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => onConditionChange(conditionType === o.value ? undefined : o.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${conditionType === o.value ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fiyat aralığı */}
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Fiyat Aralığı (₺)</label>
        <form onSubmit={e => { e.preventDefault(); onPriceApply() }} className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={priceMinDraft}
            onChange={e => onPriceMinDraftChange(e.target.value)}
            placeholder="Min"
            className="w-full min-w-0 rounded-lg border border-gray-200 py-2.5 px-3 text-sm outline-none focus:border-primary-500"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={priceMaxDraft}
            onChange={e => onPriceMaxDraftChange(e.target.value)}
            placeholder="Max"
            className="w-full min-w-0 rounded-lg border border-gray-200 py-2.5 px-3 text-sm outline-none focus:border-primary-500"
          />
        </form>
        <button
          type="button"
          onClick={onPriceApply}
          className="mt-2 w-full rounded-lg border border-gray-200 py-2 text-xs font-bold text-gray-600 hover:border-primary-400 hover:text-primary-600"
        >
          Fiyatı Uygula
        </button>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-gray-500 hover:text-red-600"
        >
          <X className="h-3.5 w-3.5" /> Filtreleri Temizle
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// İlan Kartı
// ═══════════════════════════════════════════════════════════

const CONDITION_LABELS: Record<ListingConditionType, string> = {
  cikma: 'Çıkma',
  sifir: 'Sıfır',
  yenilenmis: 'Yenilenmiş',
}

const CONDITION_COLORS: Record<ListingConditionType, string> = {
  cikma: 'bg-amber-100 text-amber-800',
  sifir: 'bg-emerald-100 text-emerald-800',
  yenilenmis: 'bg-blue-100 text-blue-800',
}

function formatListingPrice(listing: ListingCardData): string {
  if (listing.price !== null) return `${listing.price.toLocaleString('tr-TR')} ₺`
  if (listing.price_min !== null && listing.price_max !== null) {
    return `${listing.price_min.toLocaleString('tr-TR')} – ${listing.price_max.toLocaleString('tr-TR')} ₺`
  }
  return 'Fiyat belirtilmemiş'
}

function ListingGridCard({ listing }: { listing: ListingCardData }) {
  const [imgFailed, setImgFailed] = useState(false)
  const hasCover = !!listing.cover && !imgFailed
  const fitmentVerified = listing.fitment_source === 'catalog_verified' || listing.fitment_source === 'vin_verified'

  return (
    <Link
      href={`/ilan/${listing.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-lg"
    >
      <div className="relative aspect-square border-b border-gray-100 bg-gray-50">
        {hasCover ? (
          <Image
            src={listing.cover!}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 20vw"
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-gray-300">
            <ImageOff className="h-9 w-9" />
            <span className="text-[10px] font-medium">Görsel yok</span>
          </div>
        )}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${CONDITION_COLORS[listing.condition_type]}`}>
          {CONDITION_LABELS[listing.condition_type]}
        </span>
        {fitmentVerified && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
            <ShieldCheck className="h-3 w-3" /> Uyum doğrulandı
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-gray-900 group-hover:text-primary-600">
          {listing.title}
        </h3>
        {listing.vehicle_label && (
          <p className="truncate text-xs text-gray-500">{listing.vehicle_label}</p>
        )}
        <p className="mt-auto text-base font-black text-gray-900">{formatListingPrice(listing)}</p>
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2 text-[11px] text-gray-500">
          <span className="flex min-w-0 items-center gap-1 truncate">
            <Store className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{listing.seller_name}</span>
          </span>
          {listing.city_name && (
            <span className="flex flex-shrink-0 items-center gap-1">
              <MapPin className="h-3 w-3" /> {listing.city_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function ListingGridSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="overflow-hidden rounded-2xl border border-gray-100">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  )
}
