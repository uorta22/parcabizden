'use client'

import { useEffect, useMemo, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  getTecBrands, getTecModels, getTecVehicles,
  getTecVehicleCategories, getTecVehicleParts,
  type TecBrand, type TecModel, type TecVehicle,
  type TecCategoriesResponse, type TecPartsResponse,
} from '@/lib/tecdoc'

type Step = 'brand' | 'model' | 'vehicle' | 'parts'

export default function ParcalarV2Page() {
  // useSearchParams Next.js 14 App Router'da Suspense sınırı içinde olmalı
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-gray-500 text-sm">Yükleniyor…</div>}>
      <ParcalarV2Inner />
    </Suspense>
  )
}

function ParcalarV2Inner() {
  const router = useRouter()
  const sp = useSearchParams()

  // URL state — paylaşılabilir/derin link
  const brandIdQ   = sp.get('brand')   ? parseInt(sp.get('brand')!, 10)   : null
  const modelIdQ   = sp.get('model')   ? parseInt(sp.get('model')!, 10)   : null
  const vehicleIdQ = sp.get('vehicle') ? parseInt(sp.get('vehicle')!, 10) : null
  const categoryIdQ = sp.get('cat')    ? parseInt(sp.get('cat')!, 10)    : null

  // Veri state
  const [brands, setBrands]       = useState<TecBrand[]>([])
  const [models, setModels]       = useState<TecModel[]>([])
  const [vehicles, setVehicles]   = useState<TecVehicle[]>([])
  const [categories, setCategories] = useState<TecCategoriesResponse | null>(null)
  const [partsRes, setPartsRes]   = useState<TecPartsResponse | null>(null)

  // UI state
  const [loading, setLoading]   = useState(false)
  const [search, setSearch]     = useState('')
  const [error, setError]       = useState<string | null>(null)

  const step: Step =
    !brandIdQ ? 'brand' :
    !modelIdQ ? 'model' :
    !vehicleIdQ ? 'vehicle' : 'parts'

  // ── Marka yükle ──
  useEffect(() => {
    setLoading(true)
    getTecBrands()
      .then(setBrands)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // ── Model yükle ──
  useEffect(() => {
    if (!brandIdQ) { setModels([]); return }
    setLoading(true)
    setError(null)
    getTecModels(brandIdQ)
      .then(setModels)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [brandIdQ])

  // ── Varyant yükle ──
  useEffect(() => {
    if (!modelIdQ) { setVehicles([]); return }
    setLoading(true)
    setError(null)
    getTecVehicles(modelIdQ)
      .then(setVehicles)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [modelIdQ])

  // ── Kategori yükle ──
  useEffect(() => {
    if (!vehicleIdQ) { setCategories(null); return }
    setLoading(true)
    setError(null)
    getTecVehicleCategories(vehicleIdQ)
      .then(setCategories)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [vehicleIdQ])

  // ── Parça yükle ──
  useEffect(() => {
    if (!vehicleIdQ || !categoryIdQ) { setPartsRes(null); return }
    setLoading(true)
    setError(null)
    getTecVehicleParts(vehicleIdQ, categoryIdQ, 1, 50)
      .then(setPartsRes)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [vehicleIdQ, categoryIdQ])

  // ── Filtreli liste ──
  const visibleBrands = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return brands
    return brands.filter(b => b.name.toLowerCase().includes(q))
  }, [brands, search])

  const visibleModels = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return models
    return models.filter(m => m.name.toLowerCase().includes(q) || (m.full_name?.toLowerCase().includes(q) ?? false))
  }, [models, search])

  const visibleVehicles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return vehicles
    return vehicles.filter(v =>
      (v.description?.toLowerCase().includes(q) ?? false) ||
      (v.engine_codes?.toLowerCase().includes(q) ?? false)
    )
  }, [vehicles, search])

  // ── Navigasyon ──
  const goBrand   = useCallback((id: number) => { setSearch(''); router.push(`/parcalar-v2?brand=${id}`) }, [router])
  const goModel   = useCallback((id: number) => { setSearch(''); router.push(`/parcalar-v2?brand=${brandIdQ}&model=${id}`) }, [router, brandIdQ])
  const goVehicle = useCallback((id: number) => { setSearch(''); router.push(`/parcalar-v2?brand=${brandIdQ}&model=${modelIdQ}&vehicle=${id}`) }, [router, brandIdQ, modelIdQ])
  const goCategory = useCallback((id: number) => router.push(`/parcalar-v2?brand=${brandIdQ}&model=${modelIdQ}&vehicle=${vehicleIdQ}&cat=${id}`), [router, brandIdQ, modelIdQ, vehicleIdQ])
  const goBack = useCallback(() => {
    setSearch('')
    if (categoryIdQ)     router.push(`/parcalar-v2?brand=${brandIdQ}&model=${modelIdQ}&vehicle=${vehicleIdQ}`)
    else if (vehicleIdQ) router.push(`/parcalar-v2?brand=${brandIdQ}&model=${modelIdQ}`)
    else if (modelIdQ)   router.push(`/parcalar-v2?brand=${brandIdQ}`)
    else                 router.push(`/parcalar-v2`)
  }, [router, brandIdQ, modelIdQ, vehicleIdQ, categoryIdQ])

  // ── Breadcrumb ──
  const selectedBrand   = brands.find(b => b.id === brandIdQ)
  const selectedModel   = models.find(m => m.id === modelIdQ)
  const selectedVehicle = vehicles.find(v => v.id === vehicleIdQ)
  const selectedCategory = categories?.flat.find(c => c.id === categoryIdQ)

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Yedek Parça Ara</h1>
        <p className="text-gray-500 text-sm">Marka → Model → Varyant → Kategori → Parça</p>
      </div>

      {/* Breadcrumb / seçilen path */}
      <nav className="flex flex-wrap items-center gap-2 mb-6 text-sm">
        <button onClick={() => router.push('/parcalar-v2')} className="text-primary-600 hover:underline">Marka</button>
        {selectedBrand && <>
          <span className="text-gray-400">›</span>
          <button onClick={() => router.push(`/parcalar-v2?brand=${brandIdQ}`)} className="text-primary-600 hover:underline">{selectedBrand.name}</button>
        </>}
        {selectedModel && <>
          <span className="text-gray-400">›</span>
          <button onClick={() => router.push(`/parcalar-v2?brand=${brandIdQ}&model=${modelIdQ}`)} className="text-primary-600 hover:underline">{selectedModel.name}</button>
        </>}
        {selectedVehicle && <>
          <span className="text-gray-400">›</span>
          <button onClick={() => router.push(`/parcalar-v2?brand=${brandIdQ}&model=${modelIdQ}&vehicle=${vehicleIdQ}`)} className="text-primary-600 hover:underline">
            {selectedVehicle.description || selectedVehicle.full_name || `KType ${selectedVehicle.id}`}
            {selectedVehicle.year_from ? ` (${selectedVehicle.year_from}${selectedVehicle.year_to ? '–' + selectedVehicle.year_to : '+'})` : ''}
          </button>
        </>}
        {selectedCategory && <>
          <span className="text-gray-400">›</span>
          <span className="text-gray-700 font-semibold">{selectedCategory.description_tr || selectedCategory.description_en}</span>
        </>}
        {(brandIdQ || modelIdQ || vehicleIdQ) && (
          <button onClick={goBack} className="ml-auto text-xs px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-50">← Geri</button>
        )}
      </nav>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Hata: {error}
        </div>
      )}

      {/* Arama (kategori/parça adımı dışında) */}
      {step !== 'parts' && (
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={
            step === 'brand'   ? 'Marka ara…' :
            step === 'model'   ? 'Model ara…' :
            'Motor kodu / açıklama ara…'
          }
          className="w-full mb-6 px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
        />
      )}

      {loading && <div className="text-gray-500 text-sm py-8 text-center">Yükleniyor…</div>}

      {/* ─── ADIM: MARKA ─── */}
      {!loading && step === 'brand' && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {visibleBrands.map(b => (
            <li key={b.id}>
              <button
                onClick={() => goBrand(b.id)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-left text-sm font-semibold text-gray-800 transition"
              >
                {b.name}
              </button>
            </li>
          ))}
          {visibleBrands.length === 0 && <li className="col-span-full text-gray-500 text-sm">Eşleşen marka yok.</li>}
        </ul>
      )}

      {/* ─── ADIM: MODEL ─── */}
      {!loading && step === 'model' && (
        <ul className="space-y-2">
          {visibleModels.map(m => (
            <li key={m.id}>
              <button
                onClick={() => goModel(m.id)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-left transition"
              >
                <div className="font-semibold text-gray-900">{m.name}</div>
                {(m.full_name || m.year_range) && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {m.full_name}{m.full_name && m.year_range ? ' · ' : ''}{m.year_range}
                  </div>
                )}
              </button>
            </li>
          ))}
          {visibleModels.length === 0 && <li className="text-gray-500 text-sm">Eşleşen model yok.</li>}
        </ul>
      )}

      {/* ─── ADIM: VARYANT ─── */}
      {!loading && step === 'vehicle' && (
        <ul className="space-y-2">
          {visibleVehicles.map(v => (
            <li key={v.id}>
              <button
                onClick={() => goVehicle(v.id)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-left transition"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-semibold text-gray-900">{v.description || v.full_name || `KType ${v.id}`}</div>
                  <div className="text-xs text-gray-500 tabular-nums flex-shrink-0">
                    {v.year_from ? `${v.year_from}${v.year_to ? `–${v.year_to}` : '+'}` : ''}
                  </div>
                </div>
                {v.engine_codes && (
                  <div className="text-xs text-gray-500 mt-1 font-mono">Motor: {v.engine_codes}</div>
                )}
              </button>
            </li>
          ))}
          {visibleVehicles.length === 0 && <li className="text-gray-500 text-sm">Eşleşen varyant yok.</li>}
        </ul>
      )}

      {/* ─── ADIM: KATEGORİ + PARÇA ─── */}
      {!loading && step === 'parts' && (
        <div className="grid md:grid-cols-[280px_1fr] gap-6">
          {/* Kategori ağacı */}
          <aside className="space-y-3">
            {categories && Object.entries(categories.tree).map(([group, nodes]) => (
              <div key={group} className="rounded-xl border border-gray-200 bg-white p-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2">{group}</h3>
                <ul className="space-y-1">
                  {nodes.map(n => (
                    <li key={n.id}>
                      <button
                        onClick={() => goCategory(n.id)}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition ${
                          n.id === categoryIdQ
                            ? 'bg-primary-500 text-white font-semibold'
                            : 'hover:bg-primary-50 text-gray-700'
                        }`}
                      >
                        {n.description_tr || n.description_en}
                        <span className="text-xs opacity-60 ml-1">({n.part_count})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!categories && <div className="text-gray-500 text-sm">Kategori bekleniyor…</div>}
          </aside>

          {/* Parça listesi */}
          <section>
            {!categoryIdQ && (
              <div className="text-gray-500 text-sm py-12 text-center bg-gray-50 rounded-xl">
                Sol taraftan bir kategori seç.
              </div>
            )}
            {categoryIdQ && partsRes && (
              <>
                <div className="mb-3 text-sm text-gray-500">
                  {partsRes.total} parça bulundu (sayfa {partsRes.page}/{Math.ceil(partsRes.total / partsRes.limit) || 1})
                </div>
                <ul className="space-y-2">
                  {partsRes.parts.map(p => (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-200">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{p.supplier_name || `Tedarikçi #${p.supplier_id}`}</div>
                        <div className="text-xs text-gray-500 font-mono">{p.part_number}</div>
                      </div>
                      {p.images && p.images.length > 0 && (
                        <span className="text-xs text-primary-600 flex-shrink-0">{p.images.length} görsel</span>
                      )}
                    </li>
                  ))}
                </ul>
                {partsRes.parts.length === 0 && (
                  <div className="text-gray-500 text-sm py-12 text-center bg-gray-50 rounded-xl">
                    Bu kategoride listelenecek parça yok.
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
