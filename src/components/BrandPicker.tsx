'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, ChevronRight, ChevronDown, X, Car } from 'lucide-react'
import { cleanModelName } from '@/lib/vehicle'

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

function getBrandLogoPath(brand: string): string {
  if (brandLogoOverrides[brand]) return `/brands/${brandLogoOverrides[brand]}`
  const slug = brand.toLowerCase().replace(/\s+/g, '-')
  return `/brands/${slug}.png`
}

// Popular brands shown first
const popularBrands = [
  'Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Toyota', 'Ford',
  'Renault', 'Fiat', 'Hyundai', 'Kia', 'Peugeot', 'Opel',
  'Honda', 'Nissan', 'Skoda', 'Volvo', 'Citroen', 'Dacia',
]

export default function BrandPicker() {
  const [tree, setTree] = useState<VehicleTree | null>(null)
  const [search, setSearch] = useState('')
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/vehicle-tree.json')
      .then(r => r.json())
      .then(setTree)
      .catch(() => {})
  }, [])

  const brands = useMemo(() => {
    if (!tree) return []
    const all = Object.keys(tree)
    // Sort: popular first, then alphabetical
    return all.sort((a, b) => {
      const aIdx = popularBrands.indexOf(a)
      const bIdx = popularBrands.indexOf(b)
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
      if (aIdx !== -1) return -1
      if (bIdx !== -1) return 1
      return a.localeCompare(b)
    })
  }, [tree])

  const filteredBrands = useMemo(() => {
    if (!search.trim()) return brands
    const q = search.toLowerCase()
    return brands.filter(b => b.toLowerCase().includes(q))
  }, [brands, search])

  const allModels = useMemo(() => {
    if (!expandedBrand || !tree) return []
    const brand = tree[expandedBrand]
    if (!brand) return []
    const models: VehicleModel[] = []
    for (const typeModels of Object.values(brand.body_types)) {
      models.push(...typeModels)
    }
    return models
  }, [expandedBrand, tree])

  if (!tree) {
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
          Marka Seçerek <span className="text-primary-500">Parça Ara</span>
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Aracınızın markasını seçin, ardından modelinizi belirleyin ve size özel parça kataloğuna ulaşın.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setExpandedBrand(null) }}
          placeholder="Marka ara... (ör: BMW, Mercedes)"
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Brand grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
        {filteredBrands.map(brandName => {
          const isExpanded = expandedBrand === brandName
          return (
            <button
              key={brandName}
              onClick={() => setExpandedBrand(isExpanded ? null : brandName)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                isExpanded
                  ? 'border-primary-500 bg-primary-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
              }`}
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <Image
                  src={getBrandLogoPath(brandName)}
                  alt={brandName}
                  width={36}
                  height={36}
                  className="object-contain"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent && !parent.querySelector('span')) {
                      const span = document.createElement('span')
                      span.className = 'w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm'
                      span.textContent = brandName.charAt(0)
                      parent.appendChild(span)
                    }
                  }}
                />
              </div>
              <span className={`text-xs font-medium text-center leading-tight ${isExpanded ? 'text-primary-600' : 'text-gray-700'}`}>
                {brandName}
              </span>
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-primary-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </button>
          )
        })}
      </div>

      {filteredBrands.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-8">Marka bulunamadı</p>
      )}

      {/* Model dropdown */}
      {expandedBrand && allModels.length > 0 && (
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-semibold text-gray-900">{expandedBrand}</span>
              <span className="text-xs text-gray-400">— {allModels.length} model</span>
            </div>
            <button onClick={() => setExpandedBrand(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-80 overflow-y-auto">
            {allModels.map(model => {
              const brandSlug = expandedBrand.toLowerCase().replace(/\s+/g, '-')
              return (
                <Link
                  key={`${model.key}-${model.slug}`}
                  href={`/parcalar?brand=${encodeURIComponent(brandSlug)}&marka=${encodeURIComponent(expandedBrand)}&model_name=${encodeURIComponent(cleanModelName(model.name))}&model_slug=${model.slug}&model_key=${model.key}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
                >
                  {model.image && (
                    <div className="w-14 h-10 flex-shrink-0 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={model.image} alt={model.name} className="w-full h-full object-contain p-0.5" />
                    </div>
                  )}
                  <span className="text-sm text-gray-700 group-hover:text-primary-600 font-medium leading-tight flex-1 min-w-0 truncate">
                    {cleanModelName(model.name)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
