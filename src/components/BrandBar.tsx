'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Loader2, X, ChevronRight, Fuel, Cog, Calendar, Gauge, ArrowLeft, Zap } from 'lucide-react'
import { fetchAutodataBrands, fetchAutodataModels, fetchAutodataGenerations, fetchVehicleSpecs } from '@/lib/api'
import { findAutodataGenerationImage } from '@/lib/vehicleImage'
import type { AutodataBrand, AutodataModel, AutodataGeneration, VehicleSpecRow } from '@/types/api'

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

// Yakıt tipi Türkçe çeviri
function fuelTr(fuel: string | null): string {
  if (!fuel) return ''
  const map: Record<string, string> = {
    'Gasoline': 'Benzin', 'Diesel': 'Dizel', 'Electric': 'Elektrik',
    'Hybrid': 'Hibrit', 'LPG': 'LPG', 'CNG': 'CNG', 'Petrol': 'Benzin',
  }
  return map[fuel] || fuel
}

// Şanzıman tipi Türkçe çeviri
function transTr(t: string | null): string {
  if (!t) return ''
  const map: Record<string, string> = {
    'Manual': 'Manuel', 'Automatic': 'Otomatik', 'CVT': 'CVT',
    'Semi-automatic': 'Yarı Otomatik', 'DCT': 'DCT', 'AMT': 'AMT',
  }
  return map[t] || t
}

type DropdownStep = 'models' | 'detail'

export default function BrandBar() {
  const router = useRouter()
  const [brands, setBrands] = useState<AutodataBrand[]>([])
  const [fetched, setFetched] = useState(false)

  // Dropdown state
  const [activeBrand, setActiveBrand] = useState<string | null>(null)
  const [activeBrandName, setActiveBrandName] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [dropdownStep, setDropdownStep] = useState<DropdownStep>('models')

  // Model listesi
  const [models, setModels] = useState<AutodataModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)

  // Model detay (nesiller + spec)
  const [selectedModel, setSelectedModel] = useState<AutodataModel | null>(null)
  const [generations, setGenerations] = useState<AutodataGeneration[]>([])
  const [gensLoading, setGensLoading] = useState(false)
  const [modelImage, setModelImage] = useState<string | null>(null)
  const [modelSpec, setModelSpec] = useState<VehicleSpecRow | null>(null)
  const [specLoading, setSpecLoading] = useState(false)

  // Seçilen nesil için güncellenen spec
  const [hoveredGen, setHoveredGen] = useState<AutodataGeneration | null>(null)
  const [hoveredGenSpec, setHoveredGenSpec] = useState<VehicleSpecRow | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)

  // Önbellekler
  const modelsCacheRef = useRef<Record<string, AutodataModel[]>>({})
  const gensCacheRef = useRef<Record<string, { gens: AutodataGeneration[], image: string | null, spec: VehicleSpecRow | null }>>({})

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

  const closeDropdown = () => {
    setActiveBrand(null)
    setShowMore(false)
    setDropdownStep('models')
    setSelectedModel(null)
    setHoveredGen(null)
    setHoveredGenSpec(null)
  }

  // Marka hover → model listesi
  const selectBrand = useCallback(async (slug: string, name: string) => {
    if (activeBrand === slug) return

    const myRequestId = ++requestIdRef.current

    setActiveBrand(slug)
    setActiveBrandName(name)
    setShowMore(false)
    setDropdownStep('models')
    setSelectedModel(null)
    setHoveredGen(null)

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
      if (requestIdRef.current !== myRequestId) return // eski istek — yoksay
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

  // Model tıkla → nesiller + spec
  const selectModel = useCallback(async (model: AutodataModel) => {
    if (!activeBrand) return

    setSelectedModel(model)
    setDropdownStep('detail')
    setHoveredGen(null)
    setHoveredGenSpec(null)

    const cacheKey = `${activeBrand}_${model.name}`

    // Önbellekte varsa direkt göster
    if (gensCacheRef.current[cacheKey]) {
      const cached = gensCacheRef.current[cacheKey]
      setGenerations(cached.gens)
      setModelImage(cached.image)
      setModelSpec(cached.spec)
      setGensLoading(false)
      setSpecLoading(false)
      return
    }

    setGenerations([])
    setModelImage(null)
    setModelSpec(null)
    setGensLoading(true)
    setSpecLoading(true)

    const myRequestId = ++requestIdRef.current

    // Paralel: nesiller + görsel + spec
    const [gensResult, imageResult, specResult] = await Promise.allSettled([
      fetchAutodataGenerations(activeBrand, model.name),
      findAutodataGenerationImage(activeBrand, model.name),
      fetchVehicleSpecs(activeBrandName, undefined, undefined, model.name),
    ])

    if (requestIdRef.current !== myRequestId) return

    const gens = gensResult.status === 'fulfilled' ? (gensResult.value.generations || []) : []
    const image = imageResult.status === 'fulfilled' ? imageResult.value : null
    const spec = specResult.status === 'fulfilled' && specResult.value.specs?.length > 0
      ? specResult.value.specs[0]
      : null

    setGenerations(gens)
    setModelImage(image)
    setModelSpec(spec)
    setGensLoading(false)
    setSpecLoading(false)

    // Önbelleğe kaydet
    gensCacheRef.current[cacheKey] = { gens, image, spec }
  }, [activeBrand, activeBrandName])

  // Nesil hover → spec güncelle
  const hoverIdRef = useRef(0)
  const handleGenHover = useCallback(async (gen: AutodataGeneration) => {
    setHoveredGen(gen)
    if (!activeBrand || !selectedModel) return

    const myHoverId = ++hoverIdRef.current
    try {
      const data = await fetchVehicleSpecs(activeBrandName, gen.name, gen.year_start ?? undefined, selectedModel.name)
      if (hoverIdRef.current !== myHoverId) return // eski hover — yoksay
      if (data.specs?.length > 0) {
        setHoveredGenSpec(data.specs[0])
      } else {
        setHoveredGenSpec(null)
      }
    } catch {
      if (hoverIdRef.current === myHoverId) setHoveredGenSpec(null)
    }
  }, [activeBrand, activeBrandName, selectedModel])

  // Nesil tıkla → parcalar sayfasına git
  const handleGenClick = (gen: AutodataGeneration) => {
    if (!activeBrand || !selectedModel) return
    const params = new URLSearchParams({
      brand: activeBrand,
      marka: activeBrandName,
      model_name: selectedModel.name,
      autodata_gen: gen.name,
    })
    if (gen.year_start) params.set('autodata_year', String(gen.year_start))
    router.push(`/parcalar?${params.toString()}`)
    closeDropdown()
  }

  // Marka tıkla → doğrudan parcalar sayfasına
  const handleBrandOnlyClick = (slug: string, name: string) => {
    router.push(`/parcalar?brand=${slug}&marka=${encodeURIComponent(name)}`)
    closeDropdown()
  }

  // Debounce: marka hover — hızlı geçişlerde gereksiz API çağrısı önle
  const brandDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedSelectBrand = useCallback((slug: string, name: string) => {
    if (brandDebounceRef.current) clearTimeout(brandDebounceRef.current)
    brandDebounceRef.current = setTimeout(() => selectBrand(slug, name), 200)
  }, [selectBrand])

  // Debounce: nesil hover — hızlı geçişlerde gereksiz spec API çağrısı önle
  const genDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedGenHover = useCallback((gen: AutodataGeneration) => {
    if (genDebounceRef.current) clearTimeout(genDebounceRef.current)
    genDebounceRef.current = setTimeout(() => handleGenHover(gen), 300)
  }, [handleGenHover])

  // Gösterilen spec: hover edilen nesil > model genel
  const activeSpec = hoveredGenSpec || modelSpec

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
    <div ref={containerRef} className="relative" onMouseLeave={closeDropdown}>
      {/* ── Yatay Marka Tabları ── */}
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {popularBrands.map(b => {
          const name = b.name || formatName(b.slug)
          const isActive = activeBrand === b.slug
          return (
            <button
              key={b.slug}
              onMouseEnter={() => debouncedSelectBrand(b.slug, name)}
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
                {dropdownStep === 'detail' && (
                  <button
                    onClick={() => { setDropdownStep('models'); setSelectedModel(null); setHoveredGen(null) }}
                    className="p-1 rounded-md hover:bg-gray-200 transition-colors text-gray-500"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getBrandLogo(activeBrand)} alt={activeBrandName} className="w-5 h-5 object-contain" />
                <span className="text-sm font-bold text-gray-900">{activeBrandName}</span>
                {dropdownStep === 'models' && !modelsLoading && (
                  <span className="text-xs text-gray-400">{models.length} model</span>
                )}
                {dropdownStep === 'detail' && selectedModel && (
                  <>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span className="text-sm font-semibold text-primary-600">{selectedModel.name}</span>
                  </>
                )}
              </div>
              <button onClick={closeDropdown} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* İçerik */}
            <div className="max-h-[480px] overflow-y-auto">
              {dropdownStep === 'models' ? (
                // ── ADIM 1: Model Listesi ──
                <div className="p-3">
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
              ) : (
                // ── ADIM 2: Model Detay — Araç Kartı + Nesiller ──
                <div className="flex flex-col lg:flex-row">
                  {/* Sol: Araç Kartı */}
                  <div className="lg:w-[320px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 p-4">
                    {/* Araç görseli */}
                    <div className="relative aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden mb-3">
                      {modelImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={modelImage}
                          alt={selectedModel?.name || ''}
                          className="w-full h-full object-contain p-3 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getBrandLogo(activeBrand)} alt={activeBrandName} className="w-12 h-12 object-contain opacity-20" />
                        </div>
                      )}
                      {/* Marka rozeti */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getBrandLogo(activeBrand)} alt={activeBrandName} className="w-4 h-4 object-contain" />
                        <span className="text-[11px] font-bold text-gray-700">{activeBrandName}</span>
                      </div>
                    </div>

                    {/* Model adı + yıl */}
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {selectedModel?.name}
                      </h3>
                      {selectedModel?.min_year && selectedModel?.max_year && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {selectedModel.min_year} – {selectedModel.max_year}
                        </p>
                      )}
                      {hoveredGen && (
                        <p className="text-xs text-primary-500 font-medium mt-1 animate-fadeIn">
                          <Zap className="w-3 h-3 inline mr-0.5" />
                          {hoveredGen.name} {hoveredGen.year_start ? `(${hoveredGen.year_start}–${hoveredGen.year_end || '...'})` : ''}
                        </p>
                      )}
                    </div>

                    {/* Tech Spec Kartı */}
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Teknik Özellikler</p>
                      {specLoading ? (
                        <div className="space-y-2">
                          {[1,2,3,4].map(i => (
                            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
                          ))}
                        </div>
                      ) : activeSpec ? (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                          {activeSpec.engine_cc && (
                            <SpecItem icon="⚙️" label="Motor" value={`${(activeSpec.engine_cc / 1000).toFixed(1)}L`} />
                          )}
                          {activeSpec.power_hp && (
                            <SpecItem icon="🐎" label="Güç" value={`${activeSpec.power_hp} HP`} />
                          )}
                          {activeSpec.torque_nm && (
                            <SpecItem icon="💪" label="Tork" value={`${activeSpec.torque_nm} Nm`} />
                          )}
                          {activeSpec.fuel_type && (
                            <SpecItem icon="⛽" label="Yakıt" value={fuelTr(activeSpec.fuel_type)} />
                          )}
                          {activeSpec.transmission && (
                            <SpecItem icon="🔧" label="Şanzıman" value={transTr(activeSpec.transmission)} />
                          )}
                          {activeSpec.drivetrain && (
                            <SpecItem icon="🛞" label="Çekiş" value={activeSpec.drivetrain} />
                          )}
                          {activeSpec.top_speed_kmh && (
                            <SpecItem icon="🏎️" label="Max Hız" value={`${activeSpec.top_speed_kmh} km/s`} />
                          )}
                          {activeSpec.accel_0_100 && (
                            <SpecItem icon="⏱️" label="0-100" value={`${activeSpec.accel_0_100}s`} />
                          )}
                          {activeSpec.fuel_combined && (
                            <SpecItem icon="📊" label="Tüketim" value={`${activeSpec.fuel_combined}L/100km`} />
                          )}
                          {activeSpec.weight_kg && (
                            <SpecItem icon="⚖️" label="Ağırlık" value={`${activeSpec.weight_kg} kg`} />
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Teknik bilgi mevcut değil</p>
                      )}
                    </div>
                  </div>

                  {/* Sağ: Nesil Listesi */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Motor / Nesil Seçin</p>
                      {!gensLoading && generations.length > 0 && (
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {generations.length} seçenek
                        </span>
                      )}
                    </div>

                    {gensLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[1,2,3,4,5,6].map(i => (
                          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : generations.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[380px] overflow-y-auto pr-1">
                        {generations.map((gen, i) => {
                          const yearLabel = gen.year_start
                            ? `${gen.year_start}–${gen.year_end || '...'}`
                            : ''
                          const isHovered = hoveredGen?.name === gen.name && hoveredGen?.year_start === gen.year_start
                          return (
                            <button
                              key={`${gen.name}-${i}`}
                              onClick={() => handleGenClick(gen)}
                              onMouseEnter={() => debouncedGenHover(gen)}
                              onMouseLeave={() => { if (genDebounceRef.current) clearTimeout(genDebounceRef.current); setHoveredGen(null); setHoveredGenSpec(null) }}
                              className={`group flex items-center gap-3 px-3 py-3 rounded-lg border transition-all text-left ${
                                isHovered
                                  ? 'border-primary-400 bg-primary-50 shadow-sm'
                                  : 'border-gray-100 hover:border-primary-300 hover:bg-primary-50/30'
                              }`}
                            >
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                isHovered ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600'
                              }`}>
                                <Gauge className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold leading-tight truncate transition-colors ${
                                  isHovered ? 'text-primary-700' : 'text-gray-800 group-hover:text-primary-600'
                                }`}>
                                  {gen.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {yearLabel && (
                                    <span className="text-[10px] text-gray-400">{yearLabel}</span>
                                  )}
                                  {gen.body_type && (
                                    <span className="text-[10px] text-gray-400">{gen.body_type}</span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${
                                isHovered ? 'text-primary-500' : 'text-gray-300 group-hover:text-primary-400'
                              }`} />
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">Bu model için nesil bilgisi bulunamadı.</p>
                      </div>
                    )}
                  </div>
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

// Teknik özellik satırı
function SpecItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] text-gray-400 leading-none">{label}</p>
        <p className="text-[11px] font-semibold text-gray-700 leading-tight truncate">{value}</p>
      </div>
    </div>
  )
}
