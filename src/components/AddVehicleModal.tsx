'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X, Search, Loader2, ChevronRight, Car, ArrowUpDown, Plus, Zap } from 'lucide-react'
import { parseModelYear, cleanModelName } from '@/lib/vehicle'
import { fetchVehicleSpecs } from '@/lib/api'
import type { VehicleSpecRow } from '@/types/api'

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

interface AddVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: {
    brand_slug: string
    brand_name: string
    generation_slug: string
    generation_name: string
    year?: number
    nickname?: string
    spec_id?: number
  }) => Promise<void>
}

const brandLogoOverrides: Record<string, string> = {
  'Mercedes': 'mercedes-benz.png',
  'MINI': 'mini.png',
  'MAN': 'man.png',
  'Genesis': 'genesis.jpg',
  'Lada': 'lada.jpg',
}

function getBrandLogo(name: string): string {
  if (brandLogoOverrides[name]) return brandLogoOverrides[name]
  return name.toLowerCase().replace(/\s+/g, '-') + '.png'
}

function brandToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

const POPULAR_BRANDS = ['BMW', 'Mercedes', 'Volkswagen', 'Audi', 'Toyota', 'Ford', 'Renault', 'Hyundai']

// Module-level cache
let treeCache: VehicleTree | null = null

export default function AddVehicleModal({ isOpen, onClose, onAdd }: AddVehicleModalProps) {
  const [tree, setTree] = useState<VehicleTree | null>(treeCache)
  const [activeBrand, setActiveBrand] = useState<string | null>(null)
  const [activeBodyType, setActiveBodyType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('oldest')
  const [animKey, setAnimKey] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Modification step
  const [pendingModel, setPendingModel] = useState<VehicleModel | null>(null)
  const [modifications, setModifications] = useState<VehicleSpecRow[]>([])
  const [modsLoading, setModsLoading] = useState(false)

  // Load vehicle tree
  useEffect(() => {
    if (!isOpen || tree) return
    fetch('/data/vehicle-tree.json')
      .then(res => res.json())
      .then(data => {
        treeCache = data
        setTree(data)
      })
      .catch(() => {})
  }, [isOpen, tree])

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 200)
    }
  }, [isOpen])

  // Escape to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const selectBrand = useCallback((brandName: string) => {
    if (!tree) return
    const brand = tree[brandName]
    if (!brand) return
    setActiveBrand(brandName)
    const bodyTypes = Object.keys(brand.body_types)
    if (bodyTypes.length > 0) {
      setActiveBodyType(bodyTypes[0])
      setAnimKey(prev => prev + 1)
    }
  }, [tree])

  const handleBodyTypeChange = useCallback((bt: string) => {
    setActiveBodyType(bt)
    setAnimKey(prev => prev + 1)
  }, [])

  const toggleSort = useCallback(() => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')
    setAnimKey(prev => prev + 1)
  }, [])

  const handleModelSelect = async (model: VehicleModel) => {
    if (!activeBrand || isSubmitting) return
    setError('')
    setPendingModel(model)
    setModsLoading(true)
    setModifications([])
    try {
      const genName = cleanModelName(model.name)
      const modelName = genName.replace(/\s*\(.*$/, '').trim()
      const year = parseModelYear(model.name)
      const slug = brandToSlug(activeBrand)
      let res = await fetchVehicleSpecs(slug, genName, year > 0 ? year : undefined)
      if (res.specs.length === 0 && modelName) {
        res = await fetchVehicleSpecs(slug, undefined, year > 0 ? year : undefined, modelName)
      }
      if (res.specs.length > 1) {
        setModifications(res.specs)
        setModsLoading(false)
        return // Show modification picker
      }
      // 0 or 1 result → add directly
      await addVehicle(model, res.specs.length === 1 ? res.specs[0].id : undefined)
    } catch {
      // Specs failed → add without spec_id
      await addVehicle(model, undefined)
    }
  }

  const addVehicle = async (model: VehicleModel, specId?: number) => {
    if (!activeBrand) return
    setIsSubmitting(true)
    setError('')
    try {
      const year = parseModelYear(model.name)
      await onAdd({
        brand_slug: brandToSlug(activeBrand),
        brand_name: activeBrand,
        generation_slug: model.slug,
        generation_name: cleanModelName(model.name),
        year: year > 0 ? year : undefined,
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
    if (!pendingModel) return
    await addVehicle(pendingModel, spec.id)
  }

  const handleSkipModification = async () => {
    if (!pendingModel) return
    await addVehicle(pendingModel, undefined)
  }

  const handleClose = () => {
    setActiveBrand(null)
    setActiveBodyType('')
    setSearchQuery('')
    setSortOrder('oldest')
    setError('')
    setIsSubmitting(false)
    setPendingModel(null)
    setModifications([])
    setModsLoading(false)
    onClose()
  }

  if (!isOpen) return null

  const allBrandNames = tree ? Object.keys(tree).sort() : []
  const filteredBrands = searchQuery
    ? allBrandNames.filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allBrandNames

  const activeBrandData = activeBrand && tree ? tree[activeBrand] : null
  const bodyTypes = activeBrandData ? Object.keys(activeBrandData.body_types) : []
  const activeModels = activeBrandData && activeBodyType
    ? [...(activeBrandData.body_types[activeBodyType] || [])].sort((a, b) => {
        const yearA = parseModelYear(a.name)
        const yearB = parseModelYear(b.name)
        return sortOrder === 'newest' ? yearB - yearA : yearA - yearB
      })
    : []
  const totalModels = activeBrandData
    ? Object.values(activeBrandData.body_types).flat().length
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div
        className="relative bg-white w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[85vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 shrink-0 bg-white">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <Plus className="w-4.5 h-4.5 text-primary-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900">Garaja Araç Ekle</h2>
            <p className="text-xs text-gray-400">Marka seçin, ardından modelinizi seçin</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error bar */}
        {error && (
          <div className="px-5 py-2.5 bg-red-50 border-b border-red-200 text-red-600 text-sm shrink-0">
            {error}
          </div>
        )}

        {/* Submitting overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-sm font-medium text-gray-600">Garaja ekleniyor...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!tree ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-xs">Markalar yükleniyor...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

            {/* ── Left Panel - Brand List ── */}
            <div className="lg:w-[340px] border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col bg-gray-50/50 shrink-0">

              {/* Search */}
              <div className="p-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setActiveBrand(null) }}
                    placeholder="Marka ara..."
                    className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 px-1 tabular-nums">
                  {filteredBrands.length} marka
                  {searchQuery && <span> &middot; &ldquo;{searchQuery}&rdquo;</span>}
                </p>
              </div>

              {/* Mobile: horizontal brand strip */}
              <div className="lg:hidden shrink-0 overflow-x-auto scrollbar-hide px-3 pb-3">
                <div className="flex gap-2">
                  {filteredBrands.map((brandName) => (
                    <button
                      key={brandName}
                      onClick={() => selectBrand(brandName)}
                      className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        activeBrand === brandName
                          ? 'bg-primary-50 border border-primary-400 shadow-sm'
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Image src={`/brands/${getBrandLogo(brandName)}`} alt={brandName} width={24} height={24} className="object-contain flex-shrink-0" />
                      <span className={`text-sm font-medium whitespace-nowrap ${activeBrand === brandName ? 'text-primary-500' : 'text-gray-600'}`}>{brandName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop: vertical brand list */}
              <div className="hidden lg:block flex-1 overflow-y-auto min-h-0 px-2 pb-2">
                <div className="flex flex-col gap-0.5">
                  {filteredBrands.map((brandName) => {
                    const modelCount = tree[brandName] ? Object.values(tree[brandName].body_types).flat().length : 0
                    const isActive = activeBrand === brandName
                    return (
                      <button
                        key={brandName}
                        onClick={() => selectBrand(brandName)}
                        className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl text-left flex-shrink-0 transition-[background-color,border-color,box-shadow] duration-200 ${
                          isActive
                            ? 'bg-primary-50 border border-primary-300'
                            : 'border border-transparent hover:bg-gray-100'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-primary-500 rounded-r-full" />
                        )}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 p-1.5 transition-[background-color] duration-200 ${
                          isActive ? 'bg-primary-50' : 'bg-gray-100 group-hover:bg-gray-200'
                        }`}>
                          <Image
                            src={`/brands/${getBrandLogo(brandName)}`}
                            alt={brandName}
                            width={28}
                            height={28}
                            className={`object-contain transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-semibold block truncate transition-colors duration-200 ${
                            isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                          }`}>{brandName}</span>
                          <span className="text-[11px] text-gray-400 tabular-nums">{modelCount} model</span>
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
                      <p className="text-sm text-gray-500 mb-1">&ldquo;{searchQuery}&rdquo; bulunamadı</p>
                      <button onClick={() => setSearchQuery('')} className="text-xs text-primary-500/70 hover:text-primary-500 transition-colors">
                        Aramayı temizle
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right Panel - Models ── */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
              {/* Modification picker overlay */}
            {pendingModel && (modifications.length > 0 || modsLoading) ? (
              <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                <div className="shrink-0 border-b border-gray-200 px-5 pt-4 pb-3">
                  <button
                    onClick={() => { setPendingModel(null); setModifications([]); setModsLoading(false) }}
                    className="text-xs text-primary-500 hover:text-primary-600 mb-2 flex items-center gap-1"
                  >
                    &larr; Modele don
                  </button>
                  <h3 className="text-gray-900 font-semibold text-[15px]">Motor Varyantini Secin</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{cleanModelName(pendingModel.name)} icin {modifications.length} varyant bulundu</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {modsLoading ? (
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
            ) : activeBrand && activeBrandData ? (
                <>
                  {/* Brand Header */}
                  <div className="shrink-0 border-b border-gray-200">
                    <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center p-1.5">
                        <Image src={`/brands/${getBrandLogo(activeBrand)}`} alt={activeBrand} width={24} height={24} className="object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 font-semibold text-[15px]">{activeBrand}</h3>
                        <p className="text-[11px] text-gray-500 tabular-nums">{totalModels} model &middot; {bodyTypes.length} kasa tipi</p>
                      </div>
                      <button
                        onClick={toggleSort}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-gray-100 border border-gray-200 hover:border-primary-400 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all duration-200"
                        title={sortOrder === 'newest' ? 'Yeniden eskiye sıralı' : 'Eskiden yeniye sıralı'}
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        <span className="hidden sm:inline">{sortOrder === 'newest' ? 'Yeni → Eski' : 'Eski → Yeni'}</span>
                      </button>
                    </div>

                    {/* Body Type Tabs */}
                    <div className="flex overflow-x-auto scrollbar-hide px-3 pb-2.5 gap-1.5">
                      {bodyTypes.map((bt) => {
                        const count = activeBrandData.body_types[bt]?.length || 0
                        const isActive = activeBodyType === bt
                        return (
                          <button
                            key={bt}
                            onClick={() => handleBodyTypeChange(bt)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-200 ${
                              isActive
                                ? 'bg-primary-50 text-primary-600 border border-primary-300'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
                            }`}
                          >
                            {bt}
                            <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-md ${
                              isActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                            }`}>{count}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Model Grid */}
                  <div className="flex-1 overflow-y-auto min-h-0 p-3 md:p-4">
                    <div key={animKey} className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {activeModels.map((model, index) => {
                        const year = parseModelYear(model.name)
                        return (
                          <button
                            key={model.key}
                            onClick={() => handleModelSelect(model)}
                            className="group relative rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:border-primary-400 hover:shadow-md transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 text-left animate-cardReveal"
                            style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
                          >
                            <div className="relative aspect-[3/2] overflow-hidden bg-gray-50">
                              <div className="absolute inset-0 bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              {year > 0 && (
                                <span className="absolute top-1.5 right-1.5 z-10 text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-500">
                                  {year}
                                </span>
                              )}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={model.image}
                                alt={model.name}
                                className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-500 ease-out"
                                loading="lazy"
                              />
                              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
                                <span className="text-[10px] text-primary-400 font-semibold uppercase tracking-wider translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                  Garaja Ekle &rarr;
                                </span>
                              </div>
                            </div>
                            <div className="px-2.5 py-2">
                              <p className="text-[12px] text-gray-600 group-hover:text-gray-900 transition-colors duration-200 leading-snug line-clamp-2 font-medium">
                                {cleanModelName(model.name)}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {activeModels.length === 0 && (
                      <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                          <p className="text-gray-500 text-sm">Bu kasa tipinde model bulunamadı</p>
                          <p className="text-gray-700 text-xs mt-1">Diğer kasa tiplerini deneyin</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* ── Empty State with Popular Brands ── */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-4">
                    <Car className="w-6 h-6 text-primary-300" />
                  </div>
                  <p className="text-gray-700 text-sm font-medium mb-1">Araç Markanızı Seçin</p>
                  <p className="text-gray-500 text-xs mb-6 max-w-[240px] leading-relaxed">
                    Soldaki listeden bir marka seçin veya arama kutusuna yazmaya başlayın
                  </p>

                  <div className="w-full max-w-xs">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2.5 font-medium">Popüler Markalar</p>
                    <div className="grid grid-cols-4 gap-2">
                      {POPULAR_BRANDS.filter(b => tree && tree[b]).map(brand => (
                        <button
                          key={brand}
                          onClick={() => selectBrand(brand)}
                          className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white border border-gray-200 hover:border-primary-300 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
                        >
                          <Image
                            src={`/brands/${getBrandLogo(brand)}`}
                            alt={brand}
                            width={28}
                            height={28}
                            className="object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-200"
                          />
                          <span className="text-[10px] text-gray-500 group-hover:text-gray-900 transition-colors duration-200 font-medium">{brand}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
