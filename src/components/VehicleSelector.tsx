'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, X, ChevronRight, ChevronLeft, Car, Loader2, Calendar, Cog, ArrowUpDown, Plus, Zap } from 'lucide-react'
import { fetchAutodataBrands, fetchAutodataModels, fetchAutodataGenerations, resolveAutodataSlug, fetchVehicleSpecs } from '@/lib/api'
import { findAutodataGenerationImage } from '@/lib/vehicleImage'
import type { AutodataBrand, AutodataModel, AutodataGeneration, VehicleSpecRow } from '@/types/api'

// ── Types ──

export interface VehicleSelection {
  brand_slug: string
  brand_name: string
  model_name: string
  generation_name: string
  generation_slug?: string
  year?: number
  body_type?: string
  spec_id?: number
}

export interface VehicleSelectorProps {
  mode: 'browse' | 'garage'
  onSelect: (data: VehicleSelection) => void | Promise<void>
  isModal?: boolean
  isOpen?: boolean
  onClose?: () => void
}

// ── Helpers ──

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

type Step = 'brands' | 'models' | 'generations' | 'modifications'

// ── Component ──

export default function VehicleSelector({ mode, onSelect, isModal, isOpen, onClose }: VehicleSelectorProps) {
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

  // Sort & body type filter (generation step)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [activeBodyType, setActiveBodyType] = useState('__all__')

  // Garage mode: modification picker
  const [modifications, setModifications] = useState<VehicleSpecRow[]>([])
  const [pendingGeneration, setPendingGeneration] = useState<AutodataGeneration | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [genImages, setGenImages] = useState<Record<string, string>>({})  // genName → imageUrl
  const [modelImages, setModelImages] = useState<Record<string, string>>({})  // modelName → imageUrl

  // Load vehicle-tree for images
  useEffect(() => {
    fetch('/data/vehicle-tree.json')
      .then(res => res.json())
      .then(setTree)
      .catch(() => {})
  }, [])

  // Load autodata brands
  useEffect(() => {
    if (isModal && !isOpen) return
    setLoading(true)
    fetchAutodataBrands()
      .then(data => setBrands(data.brands))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isModal, isOpen])

  // Keyboard shortcut (non-modal only)
  useEffect(() => {
    if (isModal) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isModal])

  // Focus search on modal open
  useEffect(() => {
    if (isModal && isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 200)
    }
  }, [isModal, isOpen])

  // Escape to close modal
  useEffect(() => {
    if (!isModal || !isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModal, isOpen])

  // Extract unique base model names from vehicle-tree for a brand
  const getTreeModels = useCallback((brandName: string): { name: string; image: string; minYear: number | null; maxYear: number | null }[] => {
    if (!tree) return []
    const treeKey = getTreeKey(brandName)
    const brandData = tree[treeKey]
    if (!brandData) return []

    // Group by base model name (strip parenthesized codes and year ranges)
    const modelMap = new Map<string, { image: string; minYear: number | null; maxYear: number | null }>()
    for (const typeModels of Object.values(brandData.body_types)) {
      for (const m of typeModels) {
        // Extract base name: "Tonale (622)(2022->)" → "Tonale"
        const baseName = m.name.replace(/\s*\([^)]*\)\s*/g, '').replace(/\s*$/, '').trim()
        if (!baseName) continue
        const yearMatch = m.name.match(/\((\d{4})->?\)/)
        const year = yearMatch ? parseInt(yearMatch[1]) : null
        const existing = modelMap.get(baseName)
        if (!existing) {
          modelMap.set(baseName, { image: m.image, minYear: year, maxYear: year })
        } else {
          if (year) {
            existing.minYear = existing.minYear ? Math.min(existing.minYear, year) : year
            existing.maxYear = existing.maxYear ? Math.max(existing.maxYear, year) : year
          }
          // Prefer image from newer entry
          if (year && existing.maxYear && year >= existing.maxYear) existing.image = m.image
        }
      }
    }
    return Array.from(modelMap.entries()).map(([name, data]) => ({ name, ...data }))
  }, [tree])

  const selectBrand = useCallback(async (brand: AutodataBrand) => {
    setSelectedBrand(brand)
    setSelectedModel(null)
    setStep('models')
    setSubLoading(true)
    setSearchQuery('')
    setModelImages({})
    try {
      const data = await fetchAutodataModels(brand.slug)
      let allModels = data.models

      // Supplement with vehicle-tree models that are missing from autodata
      const treeModels = getTreeModels(brand.name)
      if (treeModels.length > 0) {
        const autodataNames = new Set(allModels.map(m => m.name.toLowerCase()))
        for (const tm of treeModels) {
          if (!autodataNames.has(tm.name.toLowerCase())) {
            allModels.push({
              name: tm.name,
              gen_count: 1,
              min_year: tm.minYear,
              max_year: tm.maxYear,
            })
          }
        }
      }

      setModels(allModels)
      // Fetch autodata images for all models in background
      const imgs: Record<string, string> = {}
      // Also include tree images as fallback
      for (const tm of treeModels) {
        if (tm.image) imgs[tm.name] = tm.image
      }
      const promises = allModels.map(m =>
        findAutodataGenerationImage(brand.name, m.name).then(img => {
          if (img) imgs[m.name] = img
        })
      )
      Promise.all(promises).then(() => setModelImages({ ...imgs }))
    } catch {
      setModels([])
    } finally {
      setSubLoading(false)
    }
  }, [getTreeModels])

  const selectModel = useCallback(async (model: AutodataModel) => {
    if (!selectedBrand) return
    setSelectedModel(model)
    setStep('generations')
    setSubLoading(true)
    setActiveBodyType('__all__')
    try {
      const data = await fetchAutodataGenerations(selectedBrand.slug, model.name)
      setGenerations(data.generations)
    } catch {
      setGenerations([])
    } finally {
      setSubLoading(false)
    }
  }, [selectedBrand])

  // Browse mode: resolve slug and navigate
  const selectGenerationBrowse = useCallback(async (gen: AutodataGeneration) => {
    if (!selectedBrand || !selectedModel) return
    setResolving(true)
    try {
      const modelLabel = `${selectedModel.name} ${gen.name !== selectedModel.name ? gen.name : ''}`.trim()
      const result = await resolveAutodataSlug(selectedBrand.slug, selectedModel.name, gen.name, gen.year_start ?? undefined)
      if (result.auto_selected) {
        const params = new URLSearchParams({
          brand: selectedBrand.slug,
          gen: result.auto_selected,
          marka: selectedBrand.name,
          model_name: modelLabel,
        })
        router.push(`/parcalar?${params.toString()}`)
      } else {
        const params = new URLSearchParams({
          brand: selectedBrand.slug,
          marka: selectedBrand.name,
          model_name: selectedModel.name,
          autodata_gen: gen.name,
        })
        if (gen.year_start) params.set('autodata_year', String(gen.year_start))
        router.push(`/parcalar?${params.toString()}`)
      }
    } catch {
      const params = new URLSearchParams({
        brand: selectedBrand.slug,
        marka: selectedBrand.name,
        model_name: selectedModel.name,
        autodata_gen: gen.name,
      })
      if (gen.year_start) params.set('autodata_year', String(gen.year_start))
      router.push(`/parcalar?${params.toString()}`)
    } finally {
      setResolving(false)
    }
  }, [selectedBrand, selectedModel, router])

  // Garage mode: fetch specs, show modification picker if needed
  const selectGenerationGarage = useCallback(async (gen: AutodataGeneration) => {
    if (!selectedBrand || !selectedModel) return
    setError('')
    setPendingGeneration(gen)
    setSubLoading(true)
    setModifications([])
    try {
      const res = await fetchVehicleSpecs(selectedBrand.slug, gen.name, gen.year_start ?? undefined)
      if (res.specs.length > 1) {
        setModifications(res.specs)
        setStep('modifications')
        setSubLoading(false)
        return
      }
      // 0 or 1 result → add directly
      await addVehicleGarage(gen, res.specs.length === 1 ? res.specs[0].id : undefined)
    } catch {
      await addVehicleGarage(gen, undefined)
    }
  }, [selectedBrand, selectedModel]) // eslint-disable-line react-hooks/exhaustive-deps

  const addVehicleGarage = async (gen: AutodataGeneration, specId?: number) => {
    if (!selectedBrand || !selectedModel) return
    setIsSubmitting(true)
    setError('')
    try {
      // Try to resolve a generation_slug for backward compat with garage storage
      let generationSlug = ''
      try {
        const result = await resolveAutodataSlug(selectedBrand.slug, selectedModel.name, gen.name, gen.year_start ?? undefined)
        if (result.auto_selected) generationSlug = result.auto_selected
      } catch { /* ignore */ }

      await onSelect({
        brand_slug: selectedBrand.slug,
        brand_name: selectedBrand.name,
        model_name: selectedModel.name,
        generation_name: gen.name,
        generation_slug: generationSlug || `${selectedModel.name}-${gen.name}`.toLowerCase().replace(/\s+/g, '-'),
        year: gen.year_start ?? undefined,
        body_type: gen.body_type ?? undefined,
        spec_id: specId,
      })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Arac eklenemedi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModificationSelect = async (spec: VehicleSpecRow) => {
    if (!pendingGeneration) return
    await addVehicleGarage(pendingGeneration, spec.id)
  }

  const handleSkipModification = async () => {
    if (!pendingGeneration) return
    await addVehicleGarage(pendingGeneration, undefined)
  }

  const selectGeneration = useCallback(async (gen: AutodataGeneration) => {
    if (mode === 'browse') {
      await selectGenerationBrowse(gen)
    } else {
      await selectGenerationGarage(gen)
    }
  }, [mode, selectGenerationBrowse, selectGenerationGarage])

  const goBack = () => {
    if (step === 'modifications') {
      setStep('generations')
      setPendingGeneration(null)
      setModifications([])
    } else if (step === 'generations') {
      setStep('models')
      setSelectedModel(null)
      setGenerations([])
      setActiveBodyType('__all__')
    } else if (step === 'models') {
      setStep('brands')
      setSelectedBrand(null)
      setModels([])
    }
  }

  const handleClose = () => {
    setStep('brands')
    setSelectedBrand(null)
    setSelectedModel(null)
    setModels([])
    setGenerations([])
    setModifications([])
    setPendingGeneration(null)
    setSearchQuery('')
    setSortOrder('newest')
    setActiveBodyType('__all__')
    setError('')
    setIsSubmitting(false)
    setResolving(false)
    onClose?.()
  }

  const toggleSort = useCallback(() => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')
  }, [])

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

  // Fetch autodata images for generation cards
  useEffect(() => {
    if (!selectedBrand || generations.length === 0) return
    setGenImages({})
    const controller = new AbortController()
    const fetchImages = async () => {
      const images: Record<string, string> = {}
      for (const gen of generations) {
        if (controller.signal.aborted) return
        const key = `${gen.name}-${gen.body_type}`
        const img = await findAutodataGenerationImage(selectedBrand.name, gen.name)
        if (img) images[key] = img
      }
      if (!controller.signal.aborted) setGenImages(images)
    }
    fetchImages()
    return () => controller.abort()
  }, [selectedBrand, generations])

  // Body type tabs derived from generations
  const bodyTypeTabs = useMemo(() => {
    if (generations.length === 0) return []
    const counts = new Map<string, number>()
    for (const gen of generations) {
      const bt = gen.body_type || 'Diger'
      counts.set(bt, (counts.get(bt) || 0) + 1)
    }
    return Array.from(counts.entries()).map(([type, count]) => ({ type, count }))
  }, [generations])

  // Sorted models
  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => {
      const yearA = (sortOrder === 'newest' ? a.max_year : a.min_year) || 0
      const yearB = (sortOrder === 'newest' ? b.max_year : b.min_year) || 0
      return sortOrder === 'newest' ? yearB - yearA : yearA - yearB
    })
  }, [models, sortOrder])

  // Filtered & sorted generations
  const filteredGenerations = useMemo(() => {
    let gens = [...generations]
    if (activeBodyType !== '__all__') {
      gens = gens.filter(g => (g.body_type || 'Diger') === activeBodyType)
    }
    gens.sort((a, b) => {
      const yearA = a.year_start || 0
      const yearB = b.year_start || 0
      return sortOrder === 'newest' ? yearB - yearA : yearA - yearB
    })
    return gens
  }, [generations, activeBodyType, sortOrder])

  // Filter brands
  const filteredBrands = searchQuery && step === 'brands'
    ? brands.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : brands

  const popularBrands = brands.filter(b => POPULAR_BRANDS_SLUGS.includes(b.slug))

  // For modal mode: don't render if not open
  if (isModal && !isOpen) return null

  // ── Inner content ──
  const content = (
    <>
      {/* Submitting overlay (garage mode) */}
      {isSubmitting && (
        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-sm font-medium text-gray-600">{mode === 'garage' ? 'Garaja ekleniyor...' : 'Yonlendiriliyor...'}</p>
          </div>
        </div>
      )}

      {/* Resolving overlay (browse mode) */}
      {resolving && (
        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-gray-500 text-sm">Parca katalogu eslestiriliyor...</p>
          </div>
        </div>
      )}

      {/* Error bar */}
      {error && (
        <div className="px-5 py-2.5 bg-red-50 border-b border-red-200 text-red-600 text-sm shrink-0">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-xs">Markalar yukleniyor...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

          {/* ── Left Panel - Brand List ── */}
          <div className={`${isModal ? 'lg:w-[340px]' : 'lg:w-[380px]'} border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col bg-gray-50/50 shrink-0`}>

            {/* Search */}
            <div className={isModal ? 'p-3 shrink-0' : 'p-4 flex-shrink-0'}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); if (step !== 'brands') { setStep('brands'); setSelectedBrand(null); setSelectedModel(null) } }}
                  placeholder="Marka ara..."
                  className={`w-full pl-10 pr-9 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200 ${isModal ? 'py-2.5' : 'py-3'}`}
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                ) : !isModal ? (
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 border border-gray-300 rounded px-1.5 py-0.5 font-mono hidden lg:inline">/</kbd>
                ) : null}
              </div>
              <p className={`text-[10px] text-gray-500 px-1 tabular-nums ${isModal ? 'mt-1.5' : 'mt-2'}`}>
                {filteredBrands.length} marka
                {searchQuery && <span className="text-gray-500"> &middot; &ldquo;{searchQuery}&rdquo;</span>}
              </p>
            </div>

            {/* Mobile: horizontal brand strip */}
            <div className={`lg:hidden shrink-0 overflow-x-auto scrollbar-hide ${isModal ? 'px-3 pb-3' : 'px-4 pb-4'}`}>
              <div className="flex gap-2">
                {filteredBrands.map((brand) => (
                  <button
                    key={brand.slug}
                    onClick={() => selectBrand(brand)}
                    className={`flex-shrink-0 flex items-center gap-2 ${isModal ? 'px-3 py-2.5' : 'gap-2.5 px-4 py-3'} rounded-xl transition-all duration-200 ${
                      selectedBrand?.slug === brand.slug
                        ? 'bg-primary-50 border border-primary-400 shadow-sm'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Image src={`/brands/${getBrandLogo(brand.name)}`} alt={brand.name} width={isModal ? 24 : 28} height={isModal ? 24 : 28} className="object-contain flex-shrink-0" />
                    <span className={`text-sm font-medium whitespace-nowrap ${selectedBrand?.slug === brand.slug ? 'text-primary-500' : 'text-gray-600'}`}>{brand.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop: vertical brand list */}
            <div className={`hidden lg:block flex-1 overflow-y-auto min-h-0 ${isModal ? 'px-2 pb-2' : 'px-3 pb-3'} ${isModal ? '' : 'max-h-[620px]'}`}>
              <div className="flex flex-col gap-0.5">
                {filteredBrands.map((brand) => {
                  const isActive = selectedBrand?.slug === brand.slug
                  return (
                    <button
                      key={brand.slug}
                      onClick={() => selectBrand(brand)}
                      className={`group relative flex items-center gap-3 ${isModal ? 'gap-3 px-3 py-3' : 'gap-3.5 px-3.5 py-3.5'} rounded-xl text-left flex-shrink-0 transition-[background-color,border-color,box-shadow] duration-200 ${
                        isActive
                          ? 'bg-primary-50 border border-primary-300'
                          : 'border border-transparent hover:bg-gray-100'
                      }`}
                    >
                      {isActive && (
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] ${isModal ? 'h-7' : 'h-8'} bg-primary-500 rounded-r-full`} />
                      )}
                      <div className={`${isModal ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl flex items-center justify-center flex-shrink-0 p-1.5 ${isModal ? 'p-1.5' : 'p-2'} transition-[background-color] duration-200 ${
                        isActive ? 'bg-primary-50' : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                        <Image
                          src={`/brands/${getBrandLogo(brand.name)}`}
                          alt={brand.name}
                          width={isModal ? 28 : 32}
                          height={isModal ? 28 : 32}
                          className={`object-contain transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`${isModal ? 'text-sm' : 'text-[15px]'} font-semibold block truncate transition-colors duration-200 ${
                          isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                        }`}>{brand.name}</span>
                        <span className={`${isModal ? 'text-[11px]' : 'text-xs'} text-gray-400 tabular-nums`}>{brand.model_count} model</span>
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

          {/* ── Right Panel ── */}
          <div className={`flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden ${!isModal ? 'min-h-[400px] lg:min-h-[620px] lg:max-h-[700px]' : ''}`}>

            {/* ── Modification Picker (garage mode) ── */}
            {step === 'modifications' && pendingGeneration && (modifications.length > 0 || subLoading) ? (
              <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                <div className="shrink-0 border-b border-gray-200 px-5 pt-4 pb-3">
                  <button
                    onClick={goBack}
                    className="text-xs text-primary-500 hover:text-primary-600 mb-2 flex items-center gap-1"
                  >
                    &larr; Nesillere don
                  </button>
                  <h3 className="text-gray-900 font-semibold text-[15px]">Motor Varyantini Secin</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{pendingGeneration.name} icin {modifications.length} varyant bulundu</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {subLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {modifications.map((spec) => (
                        <button
                          key={spec.id}
                          onClick={() => handleModificationSelect(spec)}
                          className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600">{spec.modification}</span>
                            <Zap className="w-4 h-4 text-gray-300 group-hover:text-primary-400" />
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-gray-500">
                            {spec.power_hp && <span>{spec.power_hp} HP</span>}
                            {spec.torque_nm && <span>{spec.torque_nm} Nm</span>}
                            {spec.engine_cc && <span>{spec.engine_cc} cc</span>}
                            {spec.fuel_type && <span>{spec.fuel_type}</span>}
                            {spec.transmission && <span className="truncate max-w-[140px]">{spec.transmission}</span>}
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={handleSkipModification}
                        className="w-full text-center py-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Motor secmeden devam et &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>

            ) : step === 'models' && selectedBrand ? (
              /* ── Models View ── */
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
                      <p className="text-[11px] text-gray-500 tabular-nums">{models.length} model &middot; Model secin</p>
                    </div>
                    <button
                      onClick={toggleSort}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-gray-100 border border-gray-200 hover:border-primary-400 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all duration-200"
                      title={sortOrder === 'newest' ? 'Yeniden eskiye sirali' : 'Eskiden yeniye sirali'}
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      <span className="hidden sm:inline">{sortOrder === 'newest' ? 'Yeni → Eski' : 'Eski → Yeni'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-5">
                  {subLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    </div>
                  ) : (
                    <div className={`grid gap-3 ${isModal ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
                      {sortedModels.map((model, index) => {
                        const autodataImg = modelImages[model.name]
                        const treeImg = findModelImage(selectedBrand.name, model.name)
                        const image = autodataImg || treeImg
                        return (
                          <button
                            key={model.name}
                            onClick={() => selectModel(model)}
                            className="group relative rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:border-primary-400 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 text-left animate-cardReveal"
                            style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                          >
                            {image && (
                              <div className={`relative ${autodataImg ? 'aspect-[16/10]' : 'aspect-[3/2]'} overflow-hidden bg-gray-50`}>
                                <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={image} alt={model.name} className={`w-full h-full ${autodataImg ? 'object-cover' : 'object-contain p-1.5'} group-hover:scale-105 transition-transform duration-500 ease-out`} loading="lazy" />
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
              /* ── Generations View with Body Type Tabs ── */
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
                      <p className="text-[11px] text-gray-500 tabular-nums">{generations.length} nesil &middot; Nesil secin</p>
                    </div>
                    <button
                      onClick={toggleSort}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-gray-100 border border-gray-200 hover:border-primary-400 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all duration-200"
                      title={sortOrder === 'newest' ? 'Yeniden eskiye sirali' : 'Eskiden yeniye sirali'}
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      <span className="hidden sm:inline">{sortOrder === 'newest' ? 'Yeni → Eski' : 'Eski → Yeni'}</span>
                    </button>
                  </div>

                  {/* Body Type Tabs */}
                  {bodyTypeTabs.length > 1 && (
                    <div className="flex overflow-x-auto scrollbar-hide px-3 pb-2.5 gap-1.5">
                      <button
                        onClick={() => setActiveBodyType('__all__')}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-200 ${
                          activeBodyType === '__all__'
                            ? 'bg-primary-50 text-primary-600 border border-primary-300'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
                        }`}
                      >
                        Tumu
                        <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-md ${
                          activeBodyType === '__all__' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                        }`}>{generations.length}</span>
                      </button>
                      {bodyTypeTabs.map(({ type, count }) => {
                        const isActive = activeBodyType === type
                        return (
                          <button
                            key={type}
                            onClick={() => setActiveBodyType(type)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-200 ${
                              isActive
                                ? 'bg-primary-50 text-primary-600 border border-primary-300'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
                            }`}
                          >
                            {type}
                            <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-md ${
                              isActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                            }`}>{count}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-5">
                  {subLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    </div>
                  ) : (
                    <div className={`grid gap-3 ${isModal ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'}`}>
                      {filteredGenerations.map((gen, index) => {
                        const genKey = `${gen.name}-${gen.body_type}`
                        const genImg = genImages[genKey]
                        return (
                        <button
                          key={genKey}
                          onClick={() => selectGeneration(gen)}
                          className="group bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hover:border-primary-400 hover:shadow-md transition-all duration-200 text-left animate-cardReveal"
                          style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                        >
                          {/* Generation image */}
                          <div className="relative aspect-[16/10] bg-gray-50 overflow-hidden">
                            {genImg ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={genImg}
                                alt={gen.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : selectedBrand ? (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
                                <Image
                                  src={`/brands/${getBrandLogo(selectedBrand.name)}`}
                                  alt={selectedBrand.name}
                                  width={40}
                                  height={40}
                                  className="object-contain opacity-30"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50" />
                            )}
                          </div>
                          <div className="p-3">
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
                          </div>
                        </button>
                        )
                      })}
                    </div>
                  )}

                  {!subLoading && filteredGenerations.length === 0 && (
                    <div className="flex items-center justify-center py-16">
                      <div className="text-center">
                        <p className="text-gray-500 text-sm">
                          {activeBodyType !== '__all__' ? 'Bu kasa tipinde nesil bulunamadi' : 'Bu model icin nesil bulunamadi'}
                        </p>
                        {activeBodyType !== '__all__' && (
                          <button onClick={() => setActiveBodyType('__all__')} className="text-xs text-primary-500 mt-1 hover:text-primary-600 transition-colors">
                            Tum nesilleri goster
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>

            ) : (
              /* ── Empty State with Popular Brands ── */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-10">
                <div className={`${isModal ? 'w-14 h-14 mb-4' : 'w-16 h-16 mb-5'} rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center`}>
                  <Car className={`${isModal ? 'w-6 h-6' : 'w-7 h-7'} text-primary-300`} />
                </div>
                <p className="text-gray-700 text-sm font-medium mb-1">Arac Markanizi Secin</p>
                <p className={`text-gray-500 text-xs mb-8 leading-relaxed ${isModal ? 'max-w-[240px] mb-6' : 'max-w-[260px]'}`}>
                  Soldaki listeden bir marka secin{mode === 'garage' ? ' veya arama kutusuna yazmaya baslayin' : ', ardindan model ve nesil belirleyin'}
                </p>

                <div className={isModal ? 'w-full max-w-xs' : 'w-full max-w-sm'}>
                  <p className={`text-[10px] text-gray-500 uppercase tracking-widest font-medium ${isModal ? 'mb-2.5' : 'mb-3'}`}>Populer Markalar</p>
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
                          width={isModal ? 28 : 32}
                          height={isModal ? 28 : 32}
                          className="object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-200"
                        />
                        <span className={`${isModal ? 'text-[10px]' : 'text-[11px]'} text-gray-500 group-hover:text-gray-900 transition-colors duration-200 font-medium`}>{brand.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )

  // ── Modal Wrapper ──
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
        <div
          className="relative bg-white w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[85vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Modal Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 shrink-0 bg-white">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <Plus className="w-4.5 h-4.5 text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">Garaja Arac Ekle</h2>
              <p className="text-xs text-gray-400">Marka secin, ardindan model ve nesil belirleyin</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {content}
        </div>
      </div>
    )
  }

  // ── Inline (browse mode) ──
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg shadow-gray-200/50 relative">
        <div className="flex flex-col">
          {content}
        </div>
      </div>
    </div>
  )
}
