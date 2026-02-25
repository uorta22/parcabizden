'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, X, ChevronRight, ChevronLeft, Car, Loader2, Calendar, Cog } from 'lucide-react'
import { fetchAutodataBrands, fetchAutodataModels, fetchAutodataGenerations, resolveAutodataSlug } from '@/lib/api'
import type { AutodataBrand, AutodataModel, AutodataGeneration } from '@/types/api'

interface VehicleModel {
  key: string
  name: string
  slug: string
  image: string
}

interface BrandData {
  id: number
  body_types: Record<string, VehicleModel[]>
}

type VehicleTree = Record<string, BrandData>

const brandLogoOverrides: Record<string, string> = {
  'Mercedes-Benz': 'mercedes-benz.png',
  'Mercedes': 'mercedes-benz.png',
  'MINI': 'mini.png',
  'MAN': 'man.png',
  'Genesis': 'genesis.jpg',
  'Lada': 'lada.jpg',
  'Alfa Romeo': 'alfa-romeo.png',
  'Land Rover': 'land-rover.png',
  'Aston Martin': 'aston-martin.png',
  'Rolls-Royce': 'rolls-royce.png',
}

function getBrandLogo(name: string): string {
  if (brandLogoOverrides[name]) return brandLogoOverrides[name]
  return name.toLowerCase().replace(/\s+/g, '-') + '.png'
}

// Map autodata brand names to vehicle-tree.json keys for logo/image lookup
const brandNameToTreeKey: Record<string, string> = {
  'Mercedes-Benz': 'Mercedes',
  'Alfa Romeo': 'Alfa Romeo',
  'Land Rover': 'Land Rover',
  'Rolls-Royce': 'Rolls-Royce',
  'Aston Martin': 'Aston Martin',
}

function getTreeKey(autodataBrandName: string): string {
  return brandNameToTreeKey[autodataBrandName] || autodataBrandName
}

const POPULAR_BRANDS_SLUGS = ['bmw', 'mercedes-benz', 'volkswagen', 'audi', 'toyota', 'ford', 'renault', 'hyundai']

type Step = 'brands' | 'models' | 'generations'

export default function BrandModelSelector() {
  const router = useRouter()
  const [tree, setTree] = useState<VehicleTree | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Step state
  const [step, setStep] = useState<Step>('brands')

  // Data from autodata
  const [brands, setBrands] = useState<AutodataBrand[]>([])
  const [models, setModels] = useState<AutodataModel[]>([])
  const [generations, setGenerations] = useState<AutodataGeneration[]>([])
  const [loading, setLoading] = useState(true)
  const [subLoading, setSubLoading] = useState(false)

  // Selection
  const [selectedBrand, setSelectedBrand] = useState<AutodataBrand | null>(null)
  const [selectedModel, setSelectedModel] = useState<AutodataModel | null>(null)
  const [resolving, setResolving] = useState(false)

  // Load vehicle-tree for images
  useEffect(() => {
    fetch('/data/vehicle-tree.json')
      .then(res => res.json())
      .then(setTree)
      .catch(() => {})
  }, [])

  // Load autodata brands
  useEffect(() => {
    setLoading(true)
    fetchAutodataBrands()
      .then(data => setBrands(data.brands))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const selectBrand = useCallback(async (brand: AutodataBrand) => {
    setSelectedBrand(brand)
    setSelectedModel(null)
    setStep('models')
    setSubLoading(true)
    setSearchQuery('')
    try {
      const data = await fetchAutodataModels(brand.slug)
      setModels(data.models)
    } catch {
      setModels([])
    } finally {
      setSubLoading(false)
    }
  }, [])

  const selectModel = useCallback(async (model: AutodataModel) => {
    if (!selectedBrand) return
    setSelectedModel(model)
    setStep('generations')
    setSubLoading(true)
    try {
      const data = await fetchAutodataGenerations(selectedBrand.slug, model.name)
      setGenerations(data.generations)
    } catch {
      setGenerations([])
    } finally {
      setSubLoading(false)
    }
  }, [selectedBrand])

  const selectGeneration = useCallback(async (gen: AutodataGeneration) => {
    if (!selectedBrand || !selectedModel) return
    setResolving(true)
    try {
      const modelLabel = `${selectedModel.name} ${gen.name !== selectedModel.name ? gen.name : ''}`.trim()
      const result = await resolveAutodataSlug(selectedBrand.slug, selectedModel.name, gen.name, gen.year_start ?? undefined)
      if (result.auto_selected) {
        // Best case: exact match found, go directly to parts
        const params = new URLSearchParams({
          brand: selectedBrand.slug,
          gen: result.auto_selected,
          marka: selectedBrand.name,
          model_name: modelLabel,
        })
        router.push(`/parcalar?${params.toString()}`)
      } else {
        // No exact match — navigate without gen, let GenerationPicker handle
        const params = new URLSearchParams({
          brand: selectedBrand.slug,
          marka: selectedBrand.name,
          model_name: selectedModel.name,
        })
        router.push(`/parcalar?${params.toString()}`)
      }
    } catch {
      // Fallback navigation
      const params = new URLSearchParams({
        brand: selectedBrand.slug,
        marka: selectedBrand.name,
        model_name: selectedModel.name,
      })
      router.push(`/parcalar?${params.toString()}`)
    } finally {
      setResolving(false)
    }
  }, [selectedBrand, selectedModel, router])

  const goBack = () => {
    if (step === 'generations') {
      setStep('models')
      setSelectedModel(null)
      setGenerations([])
    } else if (step === 'models') {
      setStep('brands')
      setSelectedBrand(null)
      setModels([])
    }
  }

  // Find model image from vehicle-tree.json via fuzzy match
  const findModelImage = (brandName: string, modelName: string): string | null => {
    if (!tree) return null
    const treeKey = getTreeKey(brandName)
    const brandData = tree[treeKey]
    if (!brandData) return null

    const modelLower = modelName.toLowerCase()
    for (const typeModels of Object.values(brandData.body_types)) {
      for (const m of typeModels) {
        const mName = m.name.replace(/\((?:\d{2}\.)?\d{4}->\)\s*$/, '').trim().toLowerCase()
        if (mName.includes(modelLower) || modelLower.includes(mName)) {
          return m.image
        }
      }
    }
    // Try partial match on first word
    const firstWord = modelLower.split(/\s+/)[0]
    if (firstWord.length >= 2) {
      for (const typeModels of Object.values(brandData.body_types)) {
        for (const m of typeModels) {
          if (m.name.toLowerCase().includes(firstWord)) {
            return m.image
          }
        }
      }
    }
    return null
  }

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-xs">Markalar yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  // Resolving overlay
  if (resolving) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl">
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-gray-500 text-sm">Parça kataloğu eşleştiriliyor...</p>
          </div>
        </div>
      </div>
    )
  }

  // Filter brands
  const filteredBrands = searchQuery && step === 'brands'
    ? brands.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : brands

  // Popular brands for empty state
  const popularBrands = brands.filter(b => POPULAR_BRANDS_SLUGS.includes(b.slug))

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg shadow-gray-200/50">
        <div className="flex flex-col lg:flex-row">

          {/* ── Left Panel - Brand List ── */}
          <div className="lg:w-[380px] border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col bg-gray-50/50">

            {/* Search */}
            <div className="p-4 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); if (step !== 'brands') { setStep('brands'); setSelectedBrand(null); setSelectedModel(null) } }}
                  placeholder="Marka ara..."
                  className="w-full pl-10 pr-9 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                ) : (
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 border border-gray-300 rounded px-1.5 py-0.5 font-mono hidden lg:inline">/</kbd>
                )}
              </div>
              <p className="text-[10px] text-gray-500 mt-2 px-1 tabular-nums">
                {filteredBrands.length} marka
                {searchQuery && <span className="text-gray-500"> &middot; &ldquo;{searchQuery}&rdquo;</span>}
              </p>
            </div>

            {/* Mobile: horizontal brand strip */}
            <div className="lg:hidden flex-shrink-0 overflow-x-auto scrollbar-hide px-4 pb-4">
              <div className="flex gap-2">
                {filteredBrands.map((brand) => (
                  <button
                    key={brand.slug}
                    onClick={() => selectBrand(brand)}
                    className={`flex-shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all duration-200 ${
                      selectedBrand?.slug === brand.slug
                        ? 'bg-primary-50 border border-primary-400 shadow-sm'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Image src={`/brands/${getBrandLogo(brand.name)}`} alt={brand.name} width={28} height={28} className="object-contain flex-shrink-0" />
                    <span className={`text-sm font-medium whitespace-nowrap ${selectedBrand?.slug === brand.slug ? 'text-primary-500' : 'text-gray-600'}`}>{brand.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop: vertical brand list */}
            <div className="hidden lg:block flex-1 overflow-y-auto min-h-0 px-3 pb-3 max-h-[620px]">
              <div className="flex flex-col gap-0.5">
                {filteredBrands.map((brand) => {
                  const isActive = selectedBrand?.slug === brand.slug
                  return (
                    <button
                      key={brand.slug}
                      onClick={() => selectBrand(brand)}
                      className={`group relative flex items-center gap-3.5 px-3.5 py-3.5 rounded-xl text-left flex-shrink-0 transition-[background-color,border-color,box-shadow] duration-200 ${
                        isActive
                          ? 'bg-primary-50 border border-primary-300'
                          : 'border border-transparent hover:bg-gray-100'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-primary-500 rounded-r-full" />
                      )}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 p-2 transition-[background-color] duration-200 ${
                        isActive ? 'bg-primary-50' : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                        <Image
                          src={`/brands/${getBrandLogo(brand.name)}`}
                          alt={brand.name}
                          width={32}
                          height={32}
                          className={`object-contain transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[15px] font-semibold block truncate transition-colors duration-200 ${
                          isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                        }`}>{brand.name}</span>
                        <span className="text-xs text-gray-400 tabular-nums">{brand.model_count} model</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
                        isActive ? 'text-primary-500 translate-x-0.5' : 'text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5'
                      }`} />
                    </button>
                  )
                })}

                {filteredBrands.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">&ldquo;{searchQuery}&rdquo; bulunamadi</p>
                    <button onClick={() => setSearchQuery('')} className="text-xs text-primary-500/70 hover:text-primary-500 transition-colors">
                      Aramayi temizle
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Panel - Models / Generations ── */}
          <div className="flex-1 flex flex-col min-w-0 min-h-[400px] lg:min-h-[620px] lg:max-h-[700px]">

            {/* ── Models View ── */}
            {step === 'models' && selectedBrand ? (
              <>
                <div className="flex-shrink-0 border-b border-gray-200">
                  <div className="flex items-center gap-3 px-5 pt-4 pb-3">
                    <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all lg:hidden">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center p-1.5">
                      <Image src={`/brands/${getBrandLogo(selectedBrand.name)}`} alt={selectedBrand.name} width={28} height={28} className="object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 font-semibold text-base">{selectedBrand.name}</h3>
                      <p className="text-[11px] text-gray-500 tabular-nums">{models.length} model &middot; Model seçin</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-5">
                  {subLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {models.map((model, index) => {
                        const image = findModelImage(selectedBrand.name, model.name)
                        return (
                          <button
                            key={model.name}
                            onClick={() => selectModel(model)}
                            className="group relative rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:border-primary-400 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 text-left animate-cardReveal"
                            style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                          >
                            {image && (
                              <div className="relative aspect-[3/2] overflow-hidden bg-gray-50">
                                <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={image} alt={model.name} className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-500 ease-out" loading="lazy" />
                              </div>
                            )}
                            <div className="px-4 py-3">
                              <p className="text-sm text-gray-900 font-semibold group-hover:text-primary-600 transition-colors">{model.name}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Cog className="w-3 h-3" /> {model.gen_count} nesil
                                </span>
                                {model.min_year && model.max_year && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {model.min_year}–{model.max_year}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {!subLoading && models.length === 0 && (
                    <div className="flex items-center justify-center py-16">
                      <div className="text-center">
                        <p className="text-gray-500 text-sm">Bu marka icin model bulunamadi</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : step === 'generations' && selectedBrand && selectedModel ? (
              /* ── Generations View ── */
              <>
                <div className="flex-shrink-0 border-b border-gray-200">
                  <div className="flex items-center gap-3 px-5 pt-4 pb-3">
                    <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center p-1.5">
                      <Image src={`/brands/${getBrandLogo(selectedBrand.name)}`} alt={selectedBrand.name} width={28} height={28} className="object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 font-semibold text-base">{selectedBrand.name} {selectedModel.name}</h3>
                      <p className="text-[11px] text-gray-500 tabular-nums">{generations.length} nesil &middot; Nesil seçin</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-5">
                  {subLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {generations.map((gen, index) => (
                        <button
                          key={`${gen.name}-${gen.body_type}`}
                          onClick={() => selectGeneration(gen)}
                          className="group bg-white border border-gray-200 shadow-sm rounded-xl p-5 hover:border-primary-400 hover:shadow-md transition-all duration-200 text-left animate-cardReveal"
                          style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                        >
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-2">{gen.name}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            {(gen.year_start || gen.year_end) && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                <Calendar className="w-3 h-3" />
                                {gen.year_start || '?'}–{gen.year_end || 'gunumuz'}
                              </span>
                            )}
                            {gen.body_type && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{gen.body_type}</span>
                            )}
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">{gen.mod_count} varyant</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!subLoading && generations.length === 0 && (
                    <div className="flex items-center justify-center py-16">
                      <div className="text-center">
                        <p className="text-gray-500 text-sm">Bu model icin nesil bulunamadi</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ── Empty State with Popular Brands ── */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-10">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-5">
                  <Car className="w-7 h-7 text-primary-300" />
                </div>
                <p className="text-gray-700 text-sm font-medium mb-1">Arac Markanizi Secin</p>
                <p className="text-gray-500 text-xs mb-8 max-w-[260px] leading-relaxed">
                  Soldaki listeden bir marka secin, ardindan model ve nesil belirleyin
                </p>

                <div className="w-full max-w-sm">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 font-medium">Populer Markalar</p>
                  <div className="grid grid-cols-4 gap-2.5">
                    {popularBrands.map(brand => (
                      <button
                        key={brand.slug}
                        onClick={() => selectBrand(brand)}
                        className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-gray-200 hover:border-primary-300 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
                      >
                        <Image
                          src={`/brands/${getBrandLogo(brand.name)}`}
                          alt={brand.name}
                          width={32}
                          height={32}
                          className="object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-200"
                        />
                        <span className="text-[11px] text-gray-500 group-hover:text-gray-900 transition-colors duration-200 font-medium">{brand.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
