'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Loader2, X } from 'lucide-react'
import { fetchAutodataBrands, fetchAutodataModels, fetchAutodataGenerations } from '@/lib/api'
import { findAutodataGenerationImage } from '@/lib/vehicleImage'
import type { AutodataBrand, AutodataGeneration } from '@/types/api'

const POPULAR_SLUGS = [
  'opel', 'bmw', 'mercedes-benz', 'volkswagen', 'audi',
  'seat', 'skoda', 'renault', 'peugeot', 'citroen',
  'ford', 'toyota', 'hyundai', 'fiat',
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

function getBrandLogo(name: string): string {
  const map: Record<string, string> = {
    'Mercedes-Benz': 'mercedes-benz.png', 'Alfa Romeo': 'alfa-romeo.png',
    'Land Rover': 'land-rover.png', 'Aston Martin': 'aston-martin.png',
    'Rolls-Royce': 'rolls-royce.png', 'MINI': 'mini.png',
  }
  return `/brands/${map[name] || name.toLowerCase().replace(/\s+/g, '-') + '.png'}`
}

interface GenCard {
  model: string
  name: string
  yearStart: number | null
  yearEnd: number | null
  image: string | null
  imageLoading: boolean
}

export default function BrandBar() {
  const router = useRouter()
  const [brands, setBrands] = useState<AutodataBrand[]>([])
  const [fetched, setFetched] = useState(false)
  const [activeBrand, setActiveBrand] = useState<string | null>(null)
  const [activeBrandName, setActiveBrandName] = useState('')
  const [genCards, setGenCards] = useState<GenCard[]>([])
  const [genLoading, setGenLoading] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
        setActiveBrand(null)
        setShowMore(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Marka seçildiğinde modelleri ve nesilleri çek
  const selectBrand = useCallback(async (slug: string, name: string) => {
    if (activeBrand === slug) { setActiveBrand(null); return }
    setActiveBrand(slug)
    setActiveBrandName(name)
    setGenCards([])
    setGenLoading(true)
    setShowMore(false)

    try {
      const { models } = await fetchAutodataModels(slug)

      // Tüm modellerin nesillerini paralel çek
      const genResults = await Promise.all(
        models.map(m =>
          fetchAutodataGenerations(slug, m.name)
            .then(d => ({ model: m.name, gens: d.generations || [] }))
            .catch(() => ({ model: m.name, gens: [] as AutodataGeneration[] }))
        )
      )

      // Düzleştir ve kart oluştur
      const cards: GenCard[] = []
      for (const { model, gens } of genResults) {
        for (const g of gens) {
          cards.push({
            model,
            name: g.name,
            yearStart: g.year_start,
            yearEnd: g.year_end,
            image: null,
            imageLoading: true,
          })
        }
      }
      setGenCards(cards)
      setGenLoading(false)

      // Görselleri progresif yükle (10'arlık batch'ler)
      const BATCH = 10
      for (let start = 0; start < cards.length; start += BATCH) {
        const batch = cards.slice(start, start + BATCH)
        const imageResults = await Promise.all(
          batch.map((card, i) =>
            findAutodataGenerationImage(name, card.name)
              .then(img => ({ index: start + i, img }))
              .catch(() => ({ index: start + i, img: null }))
          )
        )
        setGenCards(prev => {
          const next = [...prev]
          for (const { index, img } of imageResults) {
            if (next[index]) {
              next[index] = { ...next[index], image: img, imageLoading: false }
            }
          }
          return next
        })
      }
    } catch {
      setGenLoading(false)
    }
  }, [activeBrand])

  // Nesil tıklandığında parcalar sayfasına yönlendir
  const handleGenClick = (slug: string, brandName: string, modelName: string, genName: string, yearStart: number | null) => {
    const params = new URLSearchParams({
      brand: slug,
      marka: brandName,
      model_name: modelName,
      autodata_gen: genName,
    })
    if (yearStart) params.set('autodata_year', String(yearStart))
    router.push(`/parcalar?${params.toString()}`)
    setActiveBrand(null)
  }

  // Marka sadece model listesine yönlendirsin (nesil yoksa)
  const handleBrandOnlyClick = (slug: string, name: string) => {
    router.push(`/parcalar?brand=${slug}&marka=${encodeURIComponent(name)}`)
    setActiveBrand(null)
    setShowMore(false)
  }

  const popularBrands = brands.filter(b => POPULAR_SLUGS.includes(b.slug))
    .sort((a, b) => POPULAR_SLUGS.indexOf(a.slug) - POPULAR_SLUGS.indexOf(b.slug))
  const otherBrands = brands.filter(b => !POPULAR_SLUGS.includes(b.slug))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'))

  if (!fetched) return <div className="h-9" /> // placeholder

  return (
    <div ref={containerRef} className="relative" onMouseLeave={() => { setActiveBrand(null); setShowMore(false) }}>
      {/* ── Yatay Marka Tabları ── */}
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {popularBrands.map(b => {
          const name = b.name || formatName(b.slug)
          const isActive = activeBrand === b.slug
          return (
            <button
              key={b.slug}
              onMouseEnter={() => selectBrand(b.slug, name)}
              onClick={() => handleBrandOnlyClick(b.slug, name)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold tracking-wide rounded-md transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {name.toUpperCase()}
            </button>
          )
        })}

        {/* Üç nokta — diğer markalar */}
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

      {/* ── Nesil Dropdown Paneli ── */}
      {activeBrand && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50">
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            {/* Başlık */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getBrandLogo(activeBrandName)} alt={activeBrandName} className="w-5 h-5 object-contain" />
                <span className="text-sm font-bold text-gray-900">{activeBrandName}</span>
                {!genLoading && genCards.length > 0 && (
                  <span className="text-xs text-gray-400">{genCards.length} nesil</span>
                )}
              </div>
              <button onClick={() => setActiveBrand(null)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* İçerik */}
            <div className="p-4 max-h-[420px] overflow-y-auto">
              {genLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">Modeller yükleniyor...</span>
                </div>
              ) : genCards.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {genCards.map((card, i) => {
                    const label = card.name
                    const yearLabel = card.yearStart
                      ? `${card.yearStart}–${card.yearEnd || '...'}`
                      : ''
                    return (
                      <button
                        key={`${card.model}-${card.name}-${i}`}
                        onClick={() => handleGenClick(activeBrand, activeBrandName, card.model, card.name, card.yearStart)}
                        className="group text-left rounded-lg border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all overflow-hidden bg-white"
                        title={`${label} ${yearLabel}`}
                      >
                        {/* Görsel */}
                        <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
                          {card.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={card.image}
                              alt={label}
                              className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : card.imageLoading ? (
                            <div className="w-full h-full bg-gray-100 animate-pulse" />
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={getBrandLogo(activeBrandName)} alt={activeBrandName} className="w-6 h-6 object-contain opacity-20" />
                          )}
                        </div>
                        {/* İsim */}
                        <div className="px-1.5 py-1.5">
                          <p className="text-[11px] font-medium text-gray-800 leading-tight truncate group-hover:text-primary-600 transition-colors">
                            {label}
                          </p>
                          {yearLabel && (
                            <p className="text-[10px] text-gray-400 truncate">{yearLabel}</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
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
          </div>
        </div>
      )}

      {/* ── Tüm Markalar Paneli ── */}
      {showMore && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50">
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
                      <img src={getBrandLogo(name)} alt={name} className="w-5 h-5 object-contain flex-shrink-0" loading="lazy" />
                      <span className="text-xs text-gray-700 font-medium truncate">{name}</span>
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
