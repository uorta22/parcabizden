'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Loader2, X, ChevronRight, Cog, Calendar } from 'lucide-react'
import { fetchAutodataBrands, fetchAutodataModels } from '@/lib/api'
import type { AutodataBrand, AutodataModel } from '@/types/api'

const POPULAR_SLUGS = [
  'audi', 'bmw', 'citroen', 'fiat', 'ford',
  'hyundai', 'mercedes-benz', 'opel', 'peugeot', 'renault',
  'seat', 'skoda', 'toyota', 'volkswagen',
]

function formatName(slug: string): string {
  const map: Record<string, string> = {
    'bmw': 'BMW', 'gmc': 'GMC', 'ds': 'DS', 'mg': 'MG', 'byd': 'BYD',
    'mercedes-benz': 'Mercedes-Benz', 'alfa-romeo': 'Alfa Romeo',
    'land-rover': 'Land Rover', 'aston-martin': 'Aston Martin',
    'rolls-royce': 'Rolls-Royce',
  }
  return map[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function getBrandLogo(slug: string): string {
  return `/brands/${slug}.webp`
}

// Dropdown sadece model listesi gösterir, nesil seçimi parcalar sayfasında yapılır

export default function BrandBar() {
  const router = useRouter()
  const [brands, setBrands] = useState<AutodataBrand[]>([])
  const [fetched, setFetched] = useState(false)

  // Dropdown state
  const [activeBrand, setActiveBrand] = useState<string | null>(null)
  const [activeBrandName, setActiveBrandName] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [dropdownStep, setDropdownStep] = useState('models')

  // Model listesi
  const [models, setModels] = useState<AutodataModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)

  // Önbellekler
  const modelsCacheRef = useRef<Record<string, AutodataModel[]>>({})

  // Marka listesini çek
  useEffect(() => {
    fetchAutodataBrands()
      .then(data => { setBrands(data.brands || []); setFetched(true) })
      .catch(() => setFetched(true))
  }, [])

  // Dış tıklama ile kapat
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const closeDropdown = useCallback(() => {
    setActiveBrand(null)
    setShowMore(false)
    setDropdownStep('models')
  }, [])

  // Marka hover → model listesi
  const selectBrand = useCallback(async (slug: string, name: string) => {
    if (activeBrand === slug) return

    const myRequestId = ++requestIdRef.current

    setActiveBrand(slug)
    setActiveBrandName(name)
    setShowMore(false)
    setDropdownStep('models')

    // Önbellekte varsa direkt göster
    if (modelsCacheRef.current[slug]) {
      setModels(modelsCacheRef.current[slug])
      setModelsLoading(false)
      return
    }

    setModels([])
    setModelsLoading(true)

    try {
      const data = await fetchAutodataModels(slug)
      if (requestIdRef.current !== myRequestId) return
      const sorted = [...(data.models || [])].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
      modelsCacheRef.current[slug] = sorted
      setModels(sorted)
    } catch {
      if (requestIdRef.current !== myRequestId) return
      setModels([])
    } finally {
      if (requestIdRef.current === myRequestId) setModelsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrand])

  // Model tıkla → parcalar sayfasına yönlendir (nesil seçimi orada yapılır)
  const selectModel = useCallback((model: AutodataModel) => {
    if (!activeBrand) return
    router.push(`/parcalar?brand=${activeBrand}&marka=${encodeURIComponent(activeBrandName)}&model_name=${encodeURIComponent(model.name)}`)
    closeDropdown()
  }, [activeBrand, activeBrandName, router, closeDropdown])

  // Marka tıkla → doğrudan parcalar sayfasına
  const handleBrandOnlyClick = (slug: string, name: string) => {
    router.push(`/parcalar?brand=${slug}&marka=${encodeURIComponent(name)}`)
    closeDropdown()
  }

  // Debounce: marka hover — mouseLeave'de iptal et
  const brandDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Son mousemove pozisyonu ve zamanı — hız tespiti için
  const lastMouseMoveRef = useRef<{ x: number; y: number; t: number } | null>(null)

  const debouncedSelectBrand = useCallback((slug: string, name: string) => {
    if (brandDebounceRef.current) clearTimeout(brandDebounceRef.current)

    // Hızlı geçiş tespiti: son 80ms içinde fare hareket etmişse kullanıcı geçiyor demektir
    // (ör. başka butona tıklayıp aşağı kayarken marka barından geçmek)
    // Bu durumda dropdown açma — kullanıcı kasıtlı hover etmiyordur
    const last = lastMouseMoveRef.current
    if (last && Date.now() - last.t < 80) return

    brandDebounceRef.current = setTimeout(() => selectBrand(slug, name), 400)
  }, [selectBrand])

  const cancelDebounce = useCallback(() => {
    if (brandDebounceRef.current) {
      clearTimeout(brandDebounceRef.current)
      brandDebounceRef.current = null
    }
  }, [])

  const popularBrands = useMemo(() =>
    brands.filter(b => POPULAR_SLUGS.includes(b.slug))
      .sort((a, b) => POPULAR_SLUGS.indexOf(a.slug) - POPULAR_SLUGS.indexOf(b.slug)),
  [brands])

  const otherBrands = useMemo(() =>
    brands.filter(b => !POPULAR_SLUGS.includes(b.slug))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr')),
  [brands])

  if (!fetched) return <div className="h-9" />

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseMove={(e) => { lastMouseMoveRef.current = { x: e.clientX, y: e.clientY, t: Date.now() } }}
      onMouseLeave={() => { cancelDebounce(); closeDropdown() }}
    >
      {/* ── Yatay Marka Tabları ── */}
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {popularBrands.map(b => {
          const name = b.name || formatName(b.slug)
          const isActive = activeBrand === b.slug
          return (
            <button
              key={b.slug}
              onMouseEnter={() => debouncedSelectBrand(b.slug, name)}
              onMouseLeave={cancelDebounce}
              onClick={() => handleBrandOnlyClick(b.slug, name)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wide rounded-md transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getBrandLogo(b.slug)} alt={name} className="w-4 h-4 object-contain" />
              {name.toUpperCase()}
            </button>
          )
        })}

        {otherBrands.length > 0 && (
          <button
            onMouseEnter={() => { setShowMore(true); setActiveBrand(null) }}
            className={`flex-shrink-0 px-2.5 py-1.5 rounded-md transition-all ${
              showMore ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Tüm markalar"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Ana Dropdown Panel ── */}
      {activeBrand && (
        <div className="absolute left-0 right-0 top-full pt-1 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            {/* Başlık */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getBrandLogo(activeBrand)} alt={activeBrandName} className="w-5 h-5 object-contain" />
                <span className="text-sm font-bold text-gray-900">{activeBrandName}</span>
                {!modelsLoading && (
                  <span className="text-xs text-gray-400">{models.length} model</span>
                )}
              </div>
              <button onClick={closeDropdown} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Model Listesi */}
            <div className="max-h-[480px] overflow-y-auto p-3">
              {modelsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">Modeller yükleniyor...</span>
                </div>
              ) : models.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                  {models.map(model => (
                    <button
                      key={model.name}
                      onClick={() => selectModel(model)}
                      className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-sm transition-all text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 truncate transition-colors">
                          {model.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <Cog className="w-2.5 h-2.5" /> {model.gen_count} nesil
                          </span>
                          {model.min_year && model.max_year && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" /> {model.min_year}–{model.max_year}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 flex-shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Bu marka için model bulunamadı.</p>
                  <button
                    onClick={() => handleBrandOnlyClick(activeBrand, activeBrandName)}
                    className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Parça kataloğuna git →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tüm Markalar Paneli ── */}
      {showMore && (
        <div className="absolute left-0 right-0 top-full pt-1 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-bold text-gray-900">Tüm Markalar</span>
              <button onClick={() => setShowMore(false)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
                {otherBrands.map(b => {
                  const name = b.name || formatName(b.slug)
                  return (
                    <button
                      key={b.slug}
                      onClick={() => selectBrand(b.slug, name)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getBrandLogo(b.slug)} alt={name} className="w-10 h-10 object-contain flex-shrink-0" loading="lazy" />
                      <span className="text-sm text-gray-700 font-medium truncate">{name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
