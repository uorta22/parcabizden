'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import Link from 'next/link'
import { Search, ChevronRight, ChevronDown, X, Car, Loader2, Calendar, Cog } from 'lucide-react'
import { fetchAutodataBrands, fetchAutodataModels } from '@/lib/api'
import type { AutodataBrand, AutodataModel } from '@/types/api'

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
}

function getBrandLogoPath(brand: string): string {
  if (brandLogoOverrides[brand]) return `/brands/${brandLogoOverrides[brand]}`
  const slug = brand.toLowerCase().replace(/\s+/g, '-')
  return `/brands/${slug}.png`
}

// Map autodata brand names to vehicle-tree.json keys
const brandNameToTreeKey: Record<string, string> = {
  'Mercedes-Benz': 'Mercedes',
}

function getTreeKey(name: string): string {
  return brandNameToTreeKey[name] || name
}

export default function BrandPicker() {
  const [brands, setBrands] = useState<AutodataBrand[]>([])
  const [tree, setTree] = useState<VehicleTree | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedBrand, setExpandedBrand] = useState<AutodataBrand | null>(null)
  const [models, setModels] = useState<AutodataModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchAutodataBrands().then(d => setBrands(d.brands)).catch(() => {}),
      fetch('/data/vehicle-tree.json').then(r => r.json()).then(setTree).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const filteredBrands = useMemo(() => {
    if (!search.trim()) return brands
    const q = search.toLowerCase()
    return brands.filter(b => b.name.toLowerCase().includes(q))
  }, [brands, search])

  const handleBrandClick = async (brand: AutodataBrand) => {
    if (expandedBrand?.slug === brand.slug) {
      setExpandedBrand(null)
      setModels([])
      return
    }
    setExpandedBrand(brand)
    setModelsLoading(true)
    try {
      const data = await fetchAutodataModels(brand.slug)
      setModels(data.models)
    } catch {
      setModels([])
    } finally {
      setModelsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Marka Secerek <span className="text-primary-500">Parca Ara</span>
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Aracinizin markasini secin, ardindan modelinizi belirleyin ve size ozel parca kataloguna ulasin.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setExpandedBrand(null) }}
          placeholder="Marka ara... (orn: BMW, Mercedes)"
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Brand grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2 sm:gap-3">
        {filteredBrands.map(brand => {
          const isExpanded = expandedBrand?.slug === brand.slug
          return (
            <Fragment key={brand.slug}>
              <button
                onClick={() => handleBrandClick(brand)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                  isExpanded
                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
                }`}
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getBrandLogoPath(brand.name)}
                    alt={brand.name}
                    className="object-contain w-10 h-10"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent && !parent.querySelector('span')) {
                        const span = document.createElement('span')
                        span.className = 'w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm'
                        span.textContent = brand.name.charAt(0)
                        parent.appendChild(span)
                      }
                    }}
                  />
                </div>
                <span className={`text-[11px] font-medium text-center leading-tight ${isExpanded ? 'text-primary-600' : 'text-gray-700'}`}>
                  {brand.name}
                </span>
              </button>

              {/* Inline model panel */}
              {isExpanded && (
                <div className="col-span-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-primary-500" />
                      <span className="text-sm font-semibold text-gray-900">{expandedBrand!.name}</span>
                      <span className="text-xs text-gray-400">— {models.length} model</span>
                    </div>
                    <button onClick={() => { setExpandedBrand(null); setModels([]) }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {modelsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                      {models.map(model => (
                        <Link
                          key={model.name}
                          href={`/parcalar?brand=${encodeURIComponent(expandedBrand!.slug)}&marka=${encodeURIComponent(expandedBrand!.name)}&model_name=${encodeURIComponent(model.name)}`}
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-700 group-hover:text-primary-600 font-medium leading-tight block truncate">
                              {model.name}
                            </span>
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
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

      {filteredBrands.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-8">Marka bulunamadi</p>
      )}
    </div>
  )
}
