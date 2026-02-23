'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Plus, Search, Loader2, ChevronRight, Car } from 'lucide-react'
import { fetchGenerations } from '@/lib/api'

interface NatroBrand {
  brand_slug: string
  brand_name: string
  gen_count: number
  part_count: number
}

interface NatroGeneration {
  generation_slug: string
  generation_name: string
  part_count: number
}

interface AddVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: {
    brand_slug: string
    brand_name: string
    generation_slug: string
    generation_name: string
    nickname?: string
  }) => Promise<void>
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

// Brand cache — load once, reuse across modal opens
let brandCache: NatroBrand[] | null = null

export default function AddVehicleModal({ isOpen, onClose, onAdd }: AddVehicleModalProps) {
  const [step, setStep] = useState<'brand' | 'generation' | 'nickname'>('brand')
  const [brands, setBrands] = useState<NatroBrand[]>(brandCache || [])
  const [generations, setGenerations] = useState<NatroGeneration[]>([])

  const [brandSlug, setBrandSlug] = useState('')
  const [brandName, setBrandName] = useState('')
  const [generationSlug, setGenerationSlug] = useState('')
  const [generationName, setGenerationName] = useState('')
  const [nickname, setNickname] = useState('')

  const [search, setSearch] = useState('')
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingGenerations, setLoadingGenerations] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const searchRef = useRef<HTMLInputElement>(null)

  // Load brands once
  useEffect(() => {
    if (!isOpen) return
    if (brands.length > 0) return
    setLoadingBrands(true)
    fetch(`${API_BASE}/?action=brands`)
      .then(r => r.json())
      .then(data => {
        const b = data.brands || []
        brandCache = b
        setBrands(b)
      })
      .catch(() => {})
      .finally(() => setLoadingBrands(false))
  }, [isOpen, brands.length])

  // Focus search on step change
  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100)
    }
  }, [isOpen, step])

  // Escape to close or go back
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        if (step === 'nickname') setStep('generation')
        else if (step === 'generation') { setStep('brand'); setSearch('') }
        else onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, step, onClose])

  const filteredBrands = useMemo(() => {
    if (!search.trim()) return brands
    const q = search.toLowerCase().replace(/\s+/g, '')
    return brands.filter(b =>
      b.brand_name.toLowerCase().replace(/\s+/g, '').includes(q) ||
      b.brand_slug.includes(q)
    )
  }, [brands, search])

  const filteredGenerations = useMemo(() => {
    if (!search.trim()) return generations
    const q = search.toLowerCase().replace(/\s+/g, '')
    return generations.filter(g =>
      g.generation_name.toLowerCase().replace(/\s+/g, '').includes(q) ||
      g.generation_slug.includes(q)
    )
  }, [generations, search])

  if (!isOpen) return null

  const handleBrandSelect = (brand: NatroBrand) => {
    setBrandSlug(brand.brand_slug)
    setBrandName(brand.brand_name)
    setGenerationSlug('')
    setGenerationName('')
    setSearch('')
    setStep('generation')
    setLoadingGenerations(true)
    fetchGenerations(brand.brand_slug)
      .then(res => setGenerations(res.generations))
      .catch(() => setGenerations([]))
      .finally(() => setLoadingGenerations(false))
  }

  const handleGenerationSelect = (gen: NatroGeneration) => {
    setGenerationSlug(gen.generation_slug)
    setGenerationName(gen.generation_name)
    setSearch('')
    setStep('nickname')
  }

  const handleBack = () => {
    if (step === 'nickname') setStep('generation')
    else if (step === 'generation') { setStep('brand'); setSearch('') }
    else onClose()
  }

  const handleSubmit = async () => {
    setError('')
    setIsSubmitting(true)
    try {
      await onAdd({
        brand_slug: brandSlug,
        brand_name: brandName,
        generation_slug: generationSlug,
        generation_name: generationName,
        nickname: nickname.trim() || undefined,
      })
      // Reset
      setBrandSlug(''); setBrandName('')
      setGenerationSlug(''); setGenerationName('')
      setNickname(''); setSearch('')
      setStep('brand'); setError('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Araç eklenemedi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSearch(''); setStep('brand'); setError('')
    setBrandSlug(''); setBrandName('')
    setGenerationSlug(''); setGenerationName('')
    setNickname('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col"
        style={{ maxHeight: '85vh' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          {step !== 'brand' && (
            <button onClick={handleBack} className="p-1 -ml-1 text-gray-400 hover:text-gray-700 transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900">
              {step === 'brand' && 'Marka Seçin'}
              {step === 'generation' && brandName}
              {step === 'nickname' && 'Araç Ekle'}
            </h2>
            {step === 'generation' && (
              <p className="text-xs text-gray-400 truncate">Model seçin</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search — brand & generation steps */}
        {(step === 'brand' || step === 'generation') && (
          <div className="px-4 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={step === 'brand' ? 'Marka ara...' : 'Model ara...'}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
          {/* Brand List */}
          {step === 'brand' && (
            loadingBrands ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
            ) : filteredBrands.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                {search ? 'Sonuç bulunamadı' : 'Marka yüklenemedi'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 p-1">
                {filteredBrands.map(b => (
                  <button
                    key={b.brand_slug}
                    onClick={() => handleBrandSelect(b)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left hover:bg-primary-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-md bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center shrink-0 transition-colors">
                      <span className="text-xs font-bold text-gray-500 group-hover:text-primary-600 transition-colors">
                        {b.brand_name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 truncate transition-colors">
                      {b.brand_name}
                    </span>
                  </button>
                ))}
              </div>
            )
          )}

          {/* Generation List */}
          {step === 'generation' && (
            loadingGenerations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
            ) : filteredGenerations.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                {search ? 'Sonuç bulunamadı' : 'Model bulunamadı'}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 p-1">
                {filteredGenerations.map(g => (
                  <button
                    key={g.generation_slug}
                    onClick={() => handleGenerationSelect(g)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-left hover:bg-primary-50 transition-colors group"
                  >
                    <Car className="w-4 h-4 text-gray-400 group-hover:text-primary-500 shrink-0 transition-colors" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors">
                      {g.generation_name}
                    </span>
                  </button>
                ))}
              </div>
            )
          )}

          {/* Nickname + Submit */}
          {step === 'nickname' && (
            <div className="p-3 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{brandName}</p>
                    <p className="text-sm text-gray-500">{generationName}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Takma Ad <span className="text-gray-400 font-normal">(opsiyonel)</span>
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="Örn: Ailemin arabası"
                  maxLength={100}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit() } }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold rounded-lg transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                {isSubmitting ? 'Ekleniyor...' : 'Garaja Ekle'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
