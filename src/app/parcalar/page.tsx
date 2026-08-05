'use client'

import { useEffect, useMemo, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Car, Calendar, Cog, Package, ChevronRight, ArrowLeft, MessageCircle, Image as ImageIcon, Check } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogos'
import { getWhatsAppUrl } from '@/lib/config'
import {
  getTecBrands, getTecModels, getTecVehicles,
  getTecVehicleCategories, getTecVehicleParts,
  type TecBrand, type TecModel, type TecVehicle,
  type TecCategoriesResponse, type TecPartsResponse,
} from '@/lib/tecdoc'

type Step = 'brand' | 'model' | 'vehicle' | 'parts'

// "ALFA ROMEO" → "Alfa Romeo" (brand logo lookup için)
function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|\s|-)\w/g, c => c.toUpperCase())
}

// Backend marka adı → BrandLogos.tsx'in beklediği key'e normalize et.
// Diacritic'leri temizle (CITROËN → CITROEN), kısaltmaları aç (VW → Volkswagen).
const BRAND_LOGO_ALIASES: Record<string, string> = {
  'Vw':            'Volkswagen',
  'Bmw':           'BMW',
  'Amc':           'AMC',
  'Mercedes-Benz': 'Mercedes-Benz',
  'Land Rover':    'Land Rover',
  'Rolls-Royce':   'Rolls-Royce',
  'Mini':          'Mini',
  'Seat':          'Seat',
  'Ssangyong':     'SsangYong',
  'Gmc':           'GMC',
}
function normalizeBrandForLogo(name: string): string {
  // 1) Diacritic stripping: CITROËN → CITROEN
  const stripped = name.normalize('NFD').replace(/[̀-ͯ]/g, '')
  // 2) Title case: CITROEN → Citroen
  const titled = titleCase(stripped)
  // 3) Alias map
  return BRAND_LOGO_ALIASES[titled] ?? titled
}

export default function ParcalarV2Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ParcalarV2Inner />
    </Suspense>
  )
}

function PageSkeleton() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-4 bg-gray-100 rounded w-96" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  )
}

function ParcalarV2Inner() {
  const router = useRouter()
  const sp = useSearchParams()

  const brandIdQ    = sp.get('brand')   ? parseInt(sp.get('brand')!, 10)   : null
  const modelIdQ    = sp.get('model')   ? parseInt(sp.get('model')!, 10)   : null
  const vehicleIdQ  = sp.get('vehicle') ? parseInt(sp.get('vehicle')!, 10) : null
  const categoryIdQ = sp.get('cat')     ? parseInt(sp.get('cat')!, 10)     : null
  const categoryQuery = sp.get('q') || ''   // anasayfadan gelen kategori ipucu (slug, örn. 'triger-kayisi')

  const [brands, setBrands]         = useState<TecBrand[]>([])
  const [models, setModels]         = useState<TecModel[]>([])
  const [vehicles, setVehicles]     = useState<TecVehicle[]>([])
  const [categories, setCategories] = useState<TecCategoriesResponse | null>(null)
  const [partsRes, setPartsRes]     = useState<TecPartsResponse | null>(null)

  const [loading, setLoading] = useState(false)
  const [search, setSearch]   = useState('')
  const [error, setError]     = useState<string | null>(null)

  const step: Step =
    !brandIdQ ? 'brand' :
    !modelIdQ ? 'model' :
    !vehicleIdQ ? 'vehicle' : 'parts'

  // ── Veri yükleme efektleri ──
  useEffect(() => { setSearch('') }, [step])

  useEffect(() => {
    setLoading(true); setError(null)
    getTecBrands().then(setBrands).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!brandIdQ) { setModels([]); return }
    setLoading(true); setError(null)
    getTecModels(brandIdQ).then(setModels).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [brandIdQ])

  useEffect(() => {
    if (!modelIdQ) { setVehicles([]); return }
    setLoading(true); setError(null)
    getTecVehicles(modelIdQ).then(setVehicles).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [modelIdQ])

  useEffect(() => {
    if (!vehicleIdQ) { setCategories(null); return }
    setLoading(true); setError(null)
    getTecVehicleCategories(vehicleIdQ).then(setCategories).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [vehicleIdQ])

  useEffect(() => {
    if (!vehicleIdQ || !categoryIdQ) { setPartsRes(null); return }
    setLoading(true); setError(null)
    getTecVehicleParts(vehicleIdQ, categoryIdQ, 1, 50)
      .then(setPartsRes).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [vehicleIdQ, categoryIdQ])

  // ── Filtreli listeler ──
  const visibleBrands = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return brands
    return brands.filter(b => b.name.toLowerCase().includes(q))
  }, [brands, search])

  const visibleModels = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return models
    return models.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.full_name?.toLowerCase().includes(q) ?? false)
    )
  }, [models, search])

  const visibleVehicles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return vehicles
    return vehicles.filter(v =>
      (v.description?.toLowerCase().includes(q) ?? false) ||
      (v.engine_codes?.toLowerCase().includes(q) ?? false) ||
      (v.full_name?.toLowerCase().includes(q) ?? false)
    )
  }, [vehicles, search])

  // ── Navigasyon — `q` ipucu tüm step'ler boyunca korunur ──
  const qSuffix = categoryQuery ? `&q=${encodeURIComponent(categoryQuery)}` : ''
  const updateUrl = useCallback((updates: Record<string, number | null>) => {
    const params = new URLSearchParams()
    const merged: Record<string, number | null> = {
      brand: brandIdQ, model: modelIdQ, vehicle: vehicleIdQ, cat: categoryIdQ, ...updates,
    }
    Object.entries(merged).forEach(([k, v]) => { if (v !== null && v !== undefined) params.set(k, String(v)) })
    if (categoryQuery) params.set('q', categoryQuery)
    router.push(`/parcalar?${params.toString()}`)
  }, [router, brandIdQ, modelIdQ, vehicleIdQ, categoryIdQ, categoryQuery])

  const selectBrand    = (id: number) => router.push(`/parcalar?brand=${id}${qSuffix}`)
  const selectModel    = (id: number) => router.push(`/parcalar?brand=${brandIdQ}&model=${id}${qSuffix}`)
  const selectVehicle  = (id: number) => router.push(`/parcalar?brand=${brandIdQ}&model=${modelIdQ}&vehicle=${id}${qSuffix}`)
  const selectCategory = (id: number) => updateUrl({ cat: id })

  // Auto-select category: kullanıcı anasayfada 'triger-kayisi' tıkladıysa,
  // varyant seçildikten sonra kategoriler yüklenince ilgili category_id'yi otomatik seç.
  useEffect(() => {
    if (!categoryQuery || categoryIdQ || !categories) return
    const q = categoryQuery.toLowerCase()
    const match = categories.flat.find(c => {
      const tr = (c.description_tr || '').toLowerCase()
      const en = (c.description_en || '').toLowerCase()
      // q içeriyor mu? örn. 'triger-kayisi' → 'triger kayışı' eşleşmesi için kelime köküne bakıyoruz
      const norm = q.replace(/-/g, ' ')
      return tr.includes(norm) || en.includes(norm.replace(/i/g, 'i'))
    })
    if (match) {
      updateUrl({ cat: match.id })
    }
  }, [categoryQuery, categoryIdQ, categories, updateUrl])
  const goBack = () => {
    if (categoryIdQ)     router.push(`/parcalar?brand=${brandIdQ}&model=${modelIdQ}&vehicle=${vehicleIdQ}`)
    else if (vehicleIdQ) router.push(`/parcalar?brand=${brandIdQ}&model=${modelIdQ}`)
    else if (modelIdQ)   router.push(`/parcalar?brand=${brandIdQ}`)
    else                 router.push(`/parcalar`)
  }

  const selectedBrand    = brands.find(b => b.id === brandIdQ)
  const selectedModel    = models.find(m => m.id === modelIdQ)
  const selectedVehicle  = vehicles.find(v => v.id === vehicleIdQ)
  const selectedCategory = categories?.flat.find(c => c.id === categoryIdQ)

  const stepIndex = step === 'brand' ? 0 : step === 'model' ? 1 : step === 'vehicle' ? 2 : 3

  // ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ── Üst başlık + breadcrumb ── */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {(brandIdQ || modelIdQ || vehicleIdQ) && (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 transition-colors w-fit"
              >
                <ArrowLeft className="w-4 h-4" /> Geri
              </button>
            )}
            <Stepper current={stepIndex} />
          </div>

          {/* Seçimler özeti */}
          {(selectedBrand || selectedModel || selectedVehicle) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs">
              {selectedBrand && (
                <SelectionPill onClick={() => router.push(`/parcalar?brand=${brandIdQ}`)} icon={<Car className="w-3 h-3" />}>
                  {selectedBrand.name}
                </SelectionPill>
              )}
              {selectedModel && (
                <SelectionPill onClick={() => router.push(`/parcalar?brand=${brandIdQ}&model=${modelIdQ}`)}>
                  {selectedModel.name}
                </SelectionPill>
              )}
              {selectedVehicle && (
                <SelectionPill onClick={() => router.push(`/parcalar?brand=${brandIdQ}&model=${modelIdQ}&vehicle=${vehicleIdQ}`)} icon={<Calendar className="w-3 h-3" />}>
                  {selectedVehicle.description || `KType ${selectedVehicle.id}`}
                  {selectedVehicle.year_from ? ` · ${selectedVehicle.year_from}${selectedVehicle.year_to ? `–${selectedVehicle.year_to}` : '+'}` : ''}
                </SelectionPill>
              )}
              {selectedCategory && (
                <span className="px-3 py-1 rounded-full bg-primary-500 text-white font-semibold">
                  {selectedCategory.description_tr || selectedCategory.description_en}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* ── Arama terimi bildirimi ──
            Header'dan gelen terim araç seçilene kadar uygulanamıyor; sessizce
            yutmak yerine kullanıcıya taşındığını gösteriyoruz. */}
        {categoryQuery && step !== 'parts' && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
            <Search className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
            <p className="text-sm text-gray-700">
              <span className="font-semibold">“{categoryQuery.replace(/-/g, ' ')}”</span> aramanız kaydedildi.
              Aracınıza birebir uyumlu parçaları listeleyebilmemiz için önce marka, model ve varyantınızı seçin —
              seçim biter bitmez bu kategoriye götüreceğiz.
            </p>
          </div>
        )}

        {/* ── Başlık ── */}
        {step !== 'parts' && (
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-1">
              {step === 'brand'   && <>Aracınızın <span className="text-primary-500">markasını</span> seçin</>}
              {step === 'model'   && <>Hangi <span className="text-primary-500">model?</span></>}
              {step === 'vehicle' && <><span className="text-primary-500">Varyantınızı</span> seçin</>}
            </h1>
            <p className="text-gray-500 text-sm">
              {step === 'brand'   && 'TecDoc katalog kapsamındaki tüm markalar'}
              {step === 'model'   && `${selectedBrand?.name} ailesindeki modeller`}
              {step === 'vehicle' && 'Yıl, motor ve şasi koduna göre tam uyumlu varyant'}
            </p>
          </div>
        )}

        {/* ── Arama kutusu ── */}
        {step !== 'parts' && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={
                step === 'brand'   ? `${brands.length} marka içinde ara…` :
                step === 'model'   ? `${models.length} model içinde ara…` :
                `${vehicles.length} varyant içinde ara (motor kodu, açıklama)…`
              }
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition"
              autoFocus
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <strong>Hata:</strong> {error}
          </div>
        )}

        {loading && <LoadingGrid step={step} />}

        {/* ─── ADIM 1: MARKA ─── */}
        {!loading && step === 'brand' && (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {visibleBrands.map(b => (
              <li key={b.id}>
                <button
                  onClick={() => selectBrand(b.id)}
                  className="group w-full px-4 py-5 rounded-2xl bg-white border border-gray-200 hover:border-primary-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center gap-3"
                >
                  <div className="w-14 h-14 flex items-center justify-center">
                    <BrandLogo brand={normalizeBrandForLogo(b.name)} size={56} />
                  </div>
                  <span className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 text-center line-clamp-2">
                    {b.name}
                  </span>
                </button>
              </li>
            ))}
            {visibleBrands.length === 0 && (
              <li className="col-span-full text-center py-16 text-gray-400 text-sm">
                Eşleşen marka yok.
              </li>
            )}
          </ul>
        )}

        {/* ─── ADIM 2: MODEL ─── */}
        {!loading && step === 'model' && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleModels.map(m => (
              <li key={m.id}>
                <button
                  onClick={() => selectModel(m.id)}
                  className="group w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all text-left flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate group-hover:text-primary-600">{m.name}</div>
                    {(m.full_name && m.full_name !== m.name) && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">{m.full_name}</div>
                    )}
                    {m.year_range && (
                      <div className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        <Calendar className="w-2.5 h-2.5" />
                        {m.year_range}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              </li>
            ))}
            {visibleModels.length === 0 && (
              <li className="col-span-full text-center py-16 text-gray-400 text-sm">
                Eşleşen model yok.
              </li>
            )}
          </ul>
        )}

        {/* ─── ADIM 3: VARYANT ─── */}
        {!loading && step === 'vehicle' && (
          <ul className="space-y-2">
            {visibleVehicles.map(v => (
              <li key={v.id}>
                <button
                  onClick={() => selectVehicle(v.id)}
                  className="group w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 group-hover:text-primary-600">
                        {v.description || v.full_name || `KType ${v.id}`}
                      </div>
                      {v.engine_codes && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                          <Cog className="w-3.5 h-3.5" />
                          <span className="font-mono">{v.engine_codes}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {v.year_from && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-full">
                          <Calendar className="w-3 h-3" />
                          {v.year_from}{v.year_to ? `–${v.year_to}` : '+'}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </button>
              </li>
            ))}
            {visibleVehicles.length === 0 && (
              <li className="text-center py-16 text-gray-400 text-sm">
                Eşleşen varyant yok.
              </li>
            )}
          </ul>
        )}

        {/* ─── ADIM 4: KATEGORİ + PARÇA ─── */}
        {step === 'parts' && (
          <PartsStep
            categories={categories}
            partsRes={partsRes}
            categoryIdQ={categoryIdQ}
            loading={loading}
            selectedBrand={selectedBrand}
            selectedModel={selectedModel}
            selectedVehicle={selectedVehicle}
            selectedCategory={selectedCategory}
            onSelectCategory={selectCategory}
          />
        )}
      </div>
    </main>
  )
}

// ═══════════════════════════════════════════════════════════
// Alt Bileşenler
// ═══════════════════════════════════════════════════════════

function Stepper({ current }: { current: number }) {
  const steps = ['Marka', 'Model', 'Varyant', 'Parça']
  return (
    <ol className="flex items-center gap-1 sm:gap-3 text-xs">
      {steps.map((label, i) => {
        const active = i === current
        const done   = i < current
        return (
          <li key={label} className="flex items-center gap-1 sm:gap-3">
            <span className={`flex items-center gap-1.5 ${active ? 'text-primary-600 font-bold' : done ? 'text-gray-700' : 'text-gray-400'}`}>
              <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                active ? 'bg-primary-500 text-white' :
                done ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </span>
            {i < steps.length - 1 && (
              <span className={`w-4 sm:w-6 h-px ${done ? 'bg-gray-300' : 'bg-gray-200'}`} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function SelectionPill({
  children, onClick, icon,
}: { children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors max-w-full"
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  )
}

function LoadingGrid({ step }: { step: Step }) {
  const cols = step === 'brand' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' :
               step === 'model' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
               'grid-cols-1'
  const heightCls = step === 'brand' ? 'h-32' : 'h-20'
  return (
    <div className={`grid gap-3 ${cols}`}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className={`${heightCls} bg-gray-100 rounded-2xl animate-pulse`} />
      ))}
    </div>
  )
}

function PartsStep({
  categories, partsRes, categoryIdQ, loading,
  selectedBrand, selectedModel, selectedVehicle, selectedCategory,
  onSelectCategory,
}: {
  categories: TecCategoriesResponse | null
  partsRes: TecPartsResponse | null
  categoryIdQ: number | null
  loading: boolean
  selectedBrand?: TecBrand
  selectedModel?: TecModel
  selectedVehicle?: TecVehicle
  selectedCategory?: TecCategoriesResponse['flat'][0]
  onSelectCategory: (id: number) => void
}) {
  // Accordion: tek seferde tek grup açık
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  useEffect(() => {
    if (categories && !openGroup) {
      const firstGroup = Object.keys(categories.tree)[0]
      if (firstGroup) setOpenGroup(firstGroup)
    }
  }, [categories]) // eslint-disable-line react-hooks/exhaustive-deps

  const vehicleLabel = selectedVehicle
    ? `${selectedBrand?.name} ${selectedModel?.name}${selectedVehicle.description ? ' · ' + selectedVehicle.description : ''}`
    : ''

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-5">
      {/* Sol: Kategori ağacı */}
      <aside className="space-y-2 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-2 lg:sticky lg:top-32">
        {!categories && loading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}
        {categories && Object.keys(categories.tree).length === 0 && (
          <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
            Bu varyanta atanmış parça kategorisi yok.
          </div>
        )}
        {categories && Object.entries(categories.tree).map(([group, nodes]) => {
          const open = openGroup === group
          const totalCount = nodes.reduce((a, n) => a + n.part_count, 0)
          return (
            <div key={group} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => setOpenGroup(open ? null : group)}
                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-bold text-xs text-gray-900 uppercase tracking-wider truncate">{group}</span>
                  <span className="text-[10px] text-gray-500">{nodes.length} kategori · {totalCount.toLocaleString('tr-TR')} parça</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`} />
              </button>
              {open && (
                <ul className="border-t border-gray-100 divide-y divide-gray-50">
                  {nodes.map(n => (
                    <li key={n.id}>
                      <button
                        onClick={() => onSelectCategory(n.id)}
                        className={`w-full text-left text-xs px-3 py-2 transition flex items-center justify-between gap-2 ${
                          n.id === categoryIdQ
                            ? 'bg-primary-500 text-white font-bold'
                            : 'hover:bg-primary-50 text-gray-700'
                        }`}
                      >
                        <span className="truncate">{n.description_tr || n.description_en}</span>
                        <span className={`flex-shrink-0 text-[10px] tabular-nums ${n.id === categoryIdQ ? 'text-white/80' : 'text-gray-400'}`}>
                          {n.part_count}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </aside>

      {/* Sağ: Parça listesi */}
      <section>
        {!categoryIdQ && (
          <div className="rounded-2xl bg-white border border-dashed border-gray-300 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700 mb-1">Parça aramak için kategori seçin</p>
            <p className="text-xs text-gray-500">Soldaki listeden bir kategori seçtiğinizde aracınıza uygun parçalar burada listelenir.</p>
          </div>
        )}

        {categoryIdQ && loading && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {categoryIdQ && partsRes && !loading && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-gray-900">
                  {selectedCategory?.description_tr || selectedCategory?.description_en}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-semibold">{partsRes.total.toLocaleString('tr-TR')}</span> uyumlu parça
                  {partsRes.has_more && <> · ilk {partsRes.limit} gösteriliyor</>}
                </p>
              </div>
            </div>

            <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5">
              {partsRes.parts.map(p => (
                <li key={p.id}>
                  <PartCard part={p} vehicleLabel={vehicleLabel} categoryLabel={selectedCategory?.description_tr || ''} />
                </li>
              ))}
            </ul>

            {partsRes.parts.length === 0 && (
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center">
                <p className="font-semibold text-gray-700">Bu kategoride listelenecek parça yok</p>
                <p className="text-xs text-gray-500 mt-1">Başka bir kategori deneyin veya WhatsApp'tan sorun.</p>
              </div>
            )}

            {/* Kategori bazlı SEO içerik bloğu */}
            {partsRes.parts.length > 0 && (
              <CategorySeoBlock
                categoryName={selectedCategory?.description_tr || selectedCategory?.description_en || 'Bu Kategori'}
                vehicleLabel={vehicleLabel}
                totalParts={partsRes.total}
              />
            )}
          </>
        )}
      </section>
    </div>
  )
}

function PartCard({
  part, vehicleLabel, categoryLabel,
}: { part: TecPartsResponse['parts'][0]; vehicleLabel: string; categoryLabel: string }) {
  const message = `Merhaba, ${vehicleLabel} aracım için ${categoryLabel ? `"${categoryLabel}" kategorisinden ` : ''}${part.supplier_name || ''} marka ${part.part_number} numaralı parçayı arıyorum.`
  const [imgFailed, setImgFailed] = useState(false)
  const hasCover = !!part.cover_url && !imgFailed
  const otherImagesCount = (part.images?.length ?? 0) - (part.cover_url ? 1 : 0)

  return (
    <div className="group h-full flex flex-col rounded-2xl bg-white border border-gray-200 hover:border-primary-400 hover:shadow-lg transition-all overflow-hidden">
      {/* Görsel kapak */}
      <div className="relative aspect-square bg-gray-50 border-b border-gray-100 flex items-center justify-center overflow-hidden">
        {hasCover ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={part.cover_url!}
            alt={`${part.supplier_name ?? ''} ${part.part_number}`}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgFailed(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-gray-300">
            <Package className="w-10 h-10" />
            <span className="text-[10px] font-medium">Görsel yok</span>
          </div>
        )}
        {otherImagesCount > 0 && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold bg-black/60 text-white rounded-full backdrop-blur-sm">
            +{otherImagesCount}
          </span>
        )}
      </div>

      {/* İçerik — 5-col grid için kompakt */}
      <div className="flex-1 flex flex-col p-2.5 gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 text-[13px] leading-tight truncate" title={part.supplier_name ?? ''}>
            {part.supplier_name || `Tedarikçi #${part.supplier_id}`}
          </div>
          <div className="font-mono text-[11px] text-gray-500 truncate mt-1" title={part.part_number}>
            {part.part_number}
          </div>
          <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
            <Check className="w-3 h-3" />
            <span>Aracınıza uygun</span>
          </div>
        </div>

        <a
          href={getWhatsAppUrl(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-[11px] font-bold transition-colors"
        >
          <MessageCircle className="w-3 h-3" />
          Fiyat Sor
        </a>
      </div>
    </div>
  )
}

// SEO content block — kategori altında teknik açıklama
function CategorySeoBlock({
  categoryName, vehicleLabel, totalParts,
}: { categoryName: string; vehicleLabel: string; totalParts: number }) {
  return (
    <div className="mt-10 rounded-2xl bg-white border border-gray-200 p-6 md:p-8">
      <h3 className="text-lg font-bold text-gray-900 mb-3">
        {categoryName} Hakkında
      </h3>
      <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
        <p>
          {vehicleLabel ? `${vehicleLabel} aracınıza ` : 'Aracınıza '}uyumlu <strong>{totalParts.toLocaleString('tr-TR')}</strong>
          {' '}adet <strong>{categoryName.toLowerCase()}</strong> parçası TecDoc kataloğu üzerinden listelenmiştir. Listedeki tüm parçalar
          orijinal ekipman üreticisi (OEM) numarası ile birebir araç uyumluluğu doğrulanarak filtrelenmiştir.
        </p>
        <p>
          Parça seçimi yaparken tedarikçi markası, üretim kalitesi ve garanti süresi gibi etkenleri göz önünde bulundurun.
          Tek tıkla WhatsApp üzerinden talep oluşturabilir, fiyat ve stok bilgisini uzman ekibimizden alabilirsiniz.
        </p>
      </div>

      <div className="mt-5 grid sm:grid-cols-3 gap-3 text-xs">
        {[
          ['OEM Eşleştirme',  'Orijinal parça numaralarıyla birebir doğrulama'],
          ['Kalite Garanti',  'Sadece tanınmış tedarikçi markalarından parça'],
          ['Hızlı Teslimat',  'Türkiye geneli kargo, kapınıza kadar'],
        ].map(([title, desc]) => (
          <div key={title} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <div className="font-bold text-gray-900 mb-0.5">{title}</div>
            <div className="text-gray-500">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
