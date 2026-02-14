'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Search, Loader2 } from 'lucide-react'
import Link from 'next/link'
import * as api from '@/lib/api'
import type { Brand, Model, Segment } from '@/types/api'

export default function VehicleSelector() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [years, setYears] = useState<number[]>([])

  const [brandId, setBrandId] = useState(0)
  const [modelId, setModelId] = useState(0)
  const [segmentId, setSegmentId] = useState(0)
  const [year, setYear] = useState(0)

  const [loadingBrands, setLoadingBrands] = useState(true)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loadingSegments, setLoadingSegments] = useState(false)
  const [loadingYears, setLoadingYears] = useState(false)

  // Load brands on mount
  useEffect(() => {
    api.getBrands()
      .then(setBrands)
      .catch(() => {})
      .finally(() => setLoadingBrands(false))
  }, [])

  // Load models when brand changes
  useEffect(() => {
    if (!brandId) { setModels([]); return }
    setLoadingModels(true)
    api.getModels(brandId)
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false))
  }, [brandId])

  // Load segments when model changes
  useEffect(() => {
    if (!modelId) { setSegments([]); return }
    setLoadingSegments(true)
    api.getSegments(modelId)
      .then(setSegments)
      .catch(() => setSegments([]))
      .finally(() => setLoadingSegments(false))
  }, [modelId])

  // Load years when segment changes
  useEffect(() => {
    if (!segmentId) { setYears([]); return }
    setLoadingYears(true)
    api.getYears(segmentId)
      .then(setYears)
      .catch(() => setYears([]))
      .finally(() => setLoadingYears(false))
  }, [segmentId])

  const handleBrandChange = (value: number) => {
    setBrandId(value)
    setModelId(0)
    setSegmentId(0)
    setYear(0)
  }

  const handleModelChange = (value: number) => {
    setModelId(value)
    setSegmentId(0)
    setYear(0)
  }

  const handleSegmentChange = (value: number) => {
    setSegmentId(value)
    setYear(0)
  }

  const canSearch = brandId && modelId

  const buildSearchUrl = () => {
    const params = new URLSearchParams()
    if (brandId) params.set('brand_id', String(brandId))
    if (modelId) params.set('model_id', String(modelId))
    if (segmentId) params.set('segment_id', String(segmentId))
    if (year) params.set('yil', String(year))
    return `/parcalar?${params.toString()}`
  }

  const formatSegmentLabel = (seg: Segment) => {
    const parts = [seg.name]
    if (seg.engine_type) parts.push(seg.engine_type)
    if (seg.body_type) parts.push(seg.body_type)
    if (seg.year_start && seg.year_end) {
      parts.push(`(${seg.year_start}-${seg.year_end})`)
    }
    return parts.join(' - ')
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Brand */}
          <div className="relative">
            <select
              value={brandId}
              onChange={(e) => handleBrandChange(Number(e.target.value))}
              disabled={loadingBrands}
              className="w-full appearance-none bg-dark-800/80 border border-dark-600 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value={0}>{loadingBrands ? 'Yükleniyor...' : 'Marka Seçin'}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {loadingBrands ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin pointer-events-none" />
            ) : (
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            )}
          </div>

          {/* Model */}
          <div className="relative">
            <select
              value={modelId}
              onChange={(e) => handleModelChange(Number(e.target.value))}
              disabled={!brandId || loadingModels}
              className="w-full appearance-none bg-dark-800/80 border border-dark-600 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value={0}>{loadingModels ? 'Yükleniyor...' : 'Model Seçin'}</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {loadingModels ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin pointer-events-none" />
            ) : (
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            )}
          </div>

          {/* Segment (Motor / Kasa Tipi) */}
          <div className="relative">
            <select
              value={segmentId}
              onChange={(e) => handleSegmentChange(Number(e.target.value))}
              disabled={!modelId || loadingSegments}
              className="w-full appearance-none bg-dark-800/80 border border-dark-600 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value={0}>{loadingSegments ? 'Yükleniyor...' : 'Motor / Kasa Tipi'}</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>{formatSegmentLabel(s)}</option>
              ))}
            </select>
            {loadingSegments ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin pointer-events-none" />
            ) : (
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            )}
          </div>

          {/* Year */}
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={!segmentId || loadingYears}
              className="w-full appearance-none bg-dark-800/80 border border-dark-600 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value={0}>{loadingYears ? 'Yükleniyor...' : 'Yıl Seçin'}</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {loadingYears ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin pointer-events-none" />
            ) : (
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            )}
          </div>
        </div>

        <div className="mt-4">
          {canSearch ? (
            <Link
              href={buildSearchUrl()}
              className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-primary-500 hover:bg-primary-600 text-dark-900 font-semibold rounded-xl transition-all hover:scale-[1.02]"
            >
              <Search className="w-5 h-5" />
              Parçaları Gör
            </Link>
          ) : (
            <button
              disabled
              className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-primary-500/30 text-dark-900/50 font-semibold rounded-xl cursor-not-allowed"
            >
              <Search className="w-5 h-5" />
              Marka ve Model Seçin
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
