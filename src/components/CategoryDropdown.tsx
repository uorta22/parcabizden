'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, Loader2 } from 'lucide-react'
import { fetchAutodataBrands } from '@/lib/api'
import type { AutodataBrand } from '@/types/api'

// Popüler markalar — öne çıkarılır
const POPULAR_SLUGS = ['bmw', 'mercedes-benz', 'volkswagen', 'audi', 'toyota', 'ford', 'renault', 'hyundai', 'opel', 'fiat', 'peugeot', 'citroen']

// Slug → display name dönüşümü
function formatBrandName(slug: string): string {
  const overrides: Record<string, string> = {
    'bmw': 'BMW', 'gmc': 'GMC', 'ds': 'DS', 'mg': 'MG', 'byd': 'BYD',
    'mercedes-benz': 'Mercedes-Benz', 'alfa-romeo': 'Alfa Romeo',
    'land-rover': 'Land Rover', 'aston-martin': 'Aston Martin',
    'rolls-royce': 'Rolls-Royce',
  }
  if (overrides[slug]) return overrides[slug]
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function getBrandLogo(name: string): string {
  const overrides: Record<string, string> = {
    'Mercedes-Benz': 'mercedes-benz.png', 'Alfa Romeo': 'alfa-romeo.png',
    'Land Rover': 'land-rover.png', 'Aston Martin': 'aston-martin.png',
    'Rolls-Royce': 'rolls-royce.png', 'MINI': 'mini.png',
  }
  return `/brands/${overrides[name] || name.toLowerCase().replace(/\s+/g, '-') + '.png'}`
}

export default function CategoryDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [brands, setBrands] = useState<AutodataBrand[]>([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Markalar lazy-load: ilk açılışta çek
  const openDropdown = () => {
    setIsOpen(true)
    if (!fetched) {
      setLoading(true)
      fetchAutodataBrands()
        .then(data => {
          setBrands(data.brands || [])
          setFetched(true)
        })
        .catch(() => setFetched(true))
        .finally(() => setLoading(false))
    }
  }

  // Popüler ve diğer markaları ayır
  const popularBrands = brands.filter(b => POPULAR_SLUGS.includes(b.slug))
    .sort((a, b) => POPULAR_SLUGS.indexOf(a.slug) - POPULAR_SLUGS.indexOf(b.slug))
  const otherBrands = brands.filter(b => !POPULAR_SLUGS.includes(b.slug))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'))

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={openDropdown}
        onMouseEnter={openDropdown}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          isOpen ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Tüm Markalar
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full pt-1 w-[560px] z-50"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="bg-white border border-gray-200 rounded-xl shadow-xl animate-fadeIn max-h-[480px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Popüler Markalar */}
                {popularBrands.length > 0 && (
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Popüler Markalar</p>
                    <div className="grid grid-cols-3 gap-1">
                      {popularBrands.map(b => {
                        const displayName = b.name || formatBrandName(b.slug)
                        return (
                          <Link
                            key={b.slug}
                            href={`/parcalar?brand=${b.slug}&marka=${encodeURIComponent(displayName)}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getBrandLogo(displayName)}
                              alt={displayName}
                              className="w-6 h-6 object-contain flex-shrink-0"
                              loading="lazy"
                            />
                            <span className="text-sm text-gray-700 font-medium truncate">{displayName}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Ayırıcı */}
                {popularBrands.length > 0 && otherBrands.length > 0 && (
                  <div className="h-px bg-gray-100 mx-3" />
                )}

                {/* Diğer Markalar */}
                {otherBrands.length > 0 && (
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Tüm Markalar</p>
                    <div className="grid grid-cols-3 gap-0.5">
                      {otherBrands.map(b => {
                        const displayName = b.name || formatBrandName(b.slug)
                        return (
                          <Link
                            key={b.slug}
                            href={`/parcalar?brand=${b.slug}&marka=${encodeURIComponent(displayName)}`}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getBrandLogo(displayName)}
                              alt={displayName}
                              className="w-5 h-5 object-contain flex-shrink-0"
                              loading="lazy"
                            />
                            <span className="text-xs text-gray-600 truncate">{displayName}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Markalar yoksa */}
                {brands.length === 0 && !loading && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-gray-500">Markalar yüklenemedi.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
