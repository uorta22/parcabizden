'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, X, ChevronRight, Car, ArrowUpDown } from 'lucide-react'
import { parseModelYear, cleanModelName } from '@/lib/vehicle'

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

const POPULAR_BRANDS = ['BMW', 'Mercedes', 'Volkswagen', 'Audi', 'Toyota', 'Ford', 'Renault', 'Hyundai']

export default function BrandModelSelector() {
  const [tree, setTree] = useState<VehicleTree | null>(null)
  const [activeBrand, setActiveBrand] = useState<string | null>(null)
  const [activeBodyType, setActiveBodyType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('oldest')
  const [animKey, setAnimKey] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/data/vehicle-tree.json')
      .then(res => res.json())
      .then(setTree)
      .catch(() => {})
  }, [])

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

  if (!tree) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl">
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 text-xs">Markalar yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  const allBrandNames = Object.keys(tree).sort()
  const filteredBrands = searchQuery
    ? allBrandNames.filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allBrandNames

  const activeBrandData = activeBrand ? tree[activeBrand] : null
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
    <div className="w-full max-w-7xl mx-auto">
      <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
        <div className="flex flex-col lg:flex-row">

          {/* ── Left Panel - Brand List ── */}
          <div className="lg:w-[380px] border-b lg:border-b-0 lg:border-r border-white/[0.06] flex flex-col bg-white/[0.01]">

            {/* Search */}
            <div className="p-4 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setActiveBrand(null) }}
                  placeholder="Marka ara..."
                  className="w-full pl-10 pr-9 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(234,179,8,0.06)] transition-all duration-200"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                ) : (
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-500 border border-white/10 rounded px-1.5 py-0.5 font-mono hidden lg:inline">/</kbd>
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
                {filteredBrands.map((brandName) => (
                  <button
                    key={brandName}
                    onClick={() => selectBrand(brandName)}
                    className={`flex-shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeBrand === brandName
                        ? 'bg-primary-500/10 border border-primary-500/30 shadow-[0_0_12px_rgba(234,179,8,0.08)]'
                        : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    <Image src={`/brands/${getBrandLogo(brandName)}`} alt={brandName} width={28} height={28} className="object-contain flex-shrink-0" />
                    <span className={`text-sm font-medium whitespace-nowrap ${activeBrand === brandName ? 'text-primary-500' : 'text-gray-300'}`}>{brandName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop: vertical brand list */}
            <div className="hidden lg:block flex-1 overflow-y-auto min-h-0 px-3 pb-3 max-h-[620px]">
              <div className="flex flex-col gap-0.5">
                {filteredBrands.map((brandName) => {
                  const modelCount = Object.values(tree[brandName].body_types).flat().length
                  const isActive = activeBrand === brandName
                  return (
                    <button
                      key={brandName}
                      onClick={() => selectBrand(brandName)}
                      className={`group relative flex items-center gap-3.5 px-3.5 py-3.5 rounded-xl text-left flex-shrink-0 transition-[background-color,border-color,box-shadow] duration-200 ${
                        isActive
                          ? 'bg-primary-500/[0.08] border border-primary-500/25 shadow-[0_0_16px_rgba(234,179,8,0.06)]'
                          : 'border border-transparent hover:bg-white/[0.04]'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-primary-500 rounded-r-full" />
                      )}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 p-2 transition-[background-color] duration-200 ${
                        isActive ? 'bg-white/[0.08]' : 'bg-white/[0.03] group-hover:bg-white/[0.06]'
                      }`}>
                        <Image
                          src={`/brands/${getBrandLogo(brandName)}`}
                          alt={brandName}
                          width={32}
                          height={32}
                          className={`object-contain transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-85 group-hover:opacity-100'}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[15px] font-semibold block truncate transition-colors duration-200 ${
                          isActive ? 'text-white' : 'text-gray-200 group-hover:text-white'
                        }`}>{brandName}</span>
                        <span className="text-xs text-gray-500 tabular-nums">{modelCount} model</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
                        isActive ? 'text-primary-500 translate-x-0.5' : 'text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5'
                      }`} />
                    </button>
                  )
                })}

                {filteredBrands.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                      <Search className="w-4 h-4 text-gray-600" />
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
          <div className="flex-1 flex flex-col min-w-0 min-h-[400px] lg:min-h-[620px] lg:max-h-[700px]">
            {activeBrand && activeBrandData ? (
              <>
                {/* Brand Header */}
                <div className="flex-shrink-0 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3 px-5 pt-4 pb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center p-1.5">
                      <Image src={`/brands/${getBrandLogo(activeBrand)}`} alt={activeBrand} width={28} height={28} className="object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-base">{activeBrand}</h3>
                      <p className="text-[11px] text-gray-400 tabular-nums">{totalModels} model &middot; {bodyTypes.length} kasa tipi</p>
                    </div>
                    <button
                      onClick={toggleSort}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.04] border border-white/[0.08] hover:border-primary-500/30 hover:bg-white/[0.06] text-gray-400 hover:text-gray-200 transition-all duration-200"
                      title={sortOrder === 'newest' ? 'Yeniden eskiye sıralı' : 'Eskiden yeniye sıralı'}
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      <span className="hidden sm:inline">{sortOrder === 'newest' ? 'Yeni → Eski' : 'Eski → Yeni'}</span>
                    </button>
                  </div>

                  {/* Body Type Tabs - Pill style */}
                  <div className="flex overflow-x-auto scrollbar-hide px-4 pb-3 gap-2">
                    {bodyTypes.map((bt) => {
                      const count = activeBrandData.body_types[bt]?.length || 0
                      const isActive = activeBodyType === bt
                      return (
                        <button
                          key={bt}
                          onClick={() => handleBodyTypeChange(bt)}
                          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-200 ${
                            isActive
                              ? 'bg-primary-500/[0.12] text-primary-400 border border-primary-500/25 shadow-[0_0_12px_rgba(234,179,8,0.06)]'
                              : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] border border-transparent'
                          }`}
                        >
                          {bt}
                          <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-md ${
                            isActive ? 'bg-primary-500/20 text-primary-500' : 'bg-white/[0.04] text-gray-500'
                          }`}>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Model Grid */}
                <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-5">
                  <div key={animKey} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {activeModels.map((model, index) => {
                      const year = parseModelYear(model.name)
                      return (
                        <Link
                          key={model.key}
                          href={`/parcalar?brand_id=${activeBrandData.id}&marka=${encodeURIComponent(activeBrand)}&model_slug=${model.slug}&model_key=${model.key}`}
                          className="group relative rounded-xl overflow-hidden bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] hover:border-primary-500/30 hover:shadow-[0_4px_24px_rgba(234,179,8,0.06)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 animate-cardReveal"
                          style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
                        >
                          <div className="relative aspect-[3/2] overflow-hidden bg-gradient-to-b from-dark-800/60 to-dark-900/80">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.04),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            {year > 0 && (
                              <span className="absolute top-2 right-2 z-10 text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-md bg-dark-900/70 backdrop-blur-sm border border-white/[0.08] text-gray-400">
                                {year}
                              </span>
                            )}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={model.image}
                              alt={model.name}
                              className="w-full h-full object-contain p-1.5 group-hover:scale-110 transition-transform duration-500 ease-out"
                              loading="lazy"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-dark-900/90 via-dark-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
                              <span className="text-[10px] text-primary-500 font-semibold uppercase tracking-wider translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                Parçaları Gör &rarr;
                              </span>
                            </div>
                          </div>
                          <div className="px-3 py-2.5">
                            <p className="text-[13px] text-gray-400 group-hover:text-white transition-colors duration-200 leading-snug line-clamp-2 font-medium">
                              {cleanModelName(model.name)}
                            </p>
                          </div>
                        </Link>
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
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-10">
                <div className="w-16 h-16 rounded-2xl bg-primary-500/[0.05] border border-primary-500/10 flex items-center justify-center mb-5">
                  <Car className="w-7 h-7 text-primary-500/30" />
                </div>
                <p className="text-gray-300 text-sm font-medium mb-1">Araç Markanızı Seçin</p>
                <p className="text-gray-500 text-xs mb-8 max-w-[260px] leading-relaxed">
                  Soldaki listeden bir marka seçin veya arama kutusuna yazmaya başlayın
                </p>

                <div className="w-full max-w-sm">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 font-medium">Popüler Markalar</p>
                  <div className="grid grid-cols-4 gap-2.5">
                    {POPULAR_BRANDS.map(brand => (
                      <button
                        key={brand}
                        onClick={() => selectBrand(brand)}
                        className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-primary-500/20 hover:bg-white/[0.04] hover:shadow-[0_0_12px_rgba(234,179,8,0.04)] transition-all duration-200"
                      >
                        <Image
                          src={`/brands/${getBrandLogo(brand)}`}
                          alt={brand}
                          width={32}
                          height={32}
                          className="object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-200"
                        />
                        <span className="text-[11px] text-gray-500 group-hover:text-gray-200 transition-colors duration-200 font-medium">{brand}</span>
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
