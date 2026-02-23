'use client'

import { useState, useEffect } from 'react'
import { X, Plus, ChevronDown, Loader2 } from 'lucide-react'
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

async function actionFetch<T>(params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_BASE}/?${query}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

export default function AddVehicleModal({ isOpen, onClose, onAdd }: AddVehicleModalProps) {
  const [brands, setBrands] = useState<NatroBrand[]>([])
  const [generations, setGenerations] = useState<NatroGeneration[]>([])

  const [brandSlug, setBrandSlug] = useState('')
  const [brandName, setBrandName] = useState('')
  const [generationSlug, setGenerationSlug] = useState('')
  const [generationName, setGenerationName] = useState('')
  const [nickname, setNickname] = useState('')

  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingGenerations, setLoadingGenerations] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Load brands when modal opens
  useEffect(() => {
    if (!isOpen) return
    if (brands.length > 0) return
    setLoadingBrands(true)
    actionFetch<{ brands: NatroBrand[] }>({ action: 'brands' })
      .then((res) => setBrands(res.brands))
      .catch(() => {})
      .finally(() => setLoadingBrands(false))
  }, [isOpen, brands.length])

  // Load generations when brand changes
  useEffect(() => {
    if (!brandSlug) { setGenerations([]); return }
    setLoadingGenerations(true)
    fetchGenerations(brandSlug)
      .then((res) => setGenerations(res.generations))
      .catch(() => setGenerations([]))
      .finally(() => setLoadingGenerations(false))
  }, [brandSlug])

  if (!isOpen) return null

  const handleBrandChange = (slug: string) => {
    const found = brands.find((b) => b.brand_slug === slug)
    setBrandSlug(slug)
    setBrandName(found ? found.brand_name : '')
    setGenerationSlug('')
    setGenerationName('')
    setError('')
  }

  const handleGenerationChange = (slug: string) => {
    const found = generations.find((g) => g.generation_slug === slug)
    setGenerationSlug(slug)
    setGenerationName(found ? found.generation_name : '')
    setError('')
  }

  const resetForm = () => {
    setBrandSlug('')
    setBrandName('')
    setGenerationSlug('')
    setGenerationName('')
    setNickname('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!brandSlug || !generationSlug) {
      setError('Marka ve nesil seçimi zorunludur')
      return
    }

    setIsSubmitting(true)
    try {
      await onAdd({
        brand_slug: brandSlug,
        brand_name: brandName,
        generation_slug: generationSlug,
        generation_name: generationName,
        nickname: nickname.trim() || undefined,
      })
      resetForm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Araç eklenemedi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white border border-gray-200 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-vehicle-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Modalı kapat"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="add-vehicle-modal-title" className="text-xl font-bold text-gray-900 mb-6">
          Araç Ekle
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Marka */}
          <div className="relative">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="brand-select">
              Marka
            </label>
            <select
              id="brand-select"
              value={brandSlug}
              onChange={(e) => handleBrandChange(e.target.value)}
              disabled={loadingBrands}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed pr-10"
            >
              <option value="">
                {loadingBrands ? 'Yükleniyor...' : 'Marka Seçin'}
              </option>
              {brands.map((b) => (
                <option key={b.brand_slug} value={b.brand_slug}>
                  {b.brand_name}
                </option>
              ))}
            </select>
            {loadingBrands ? (
              <Loader2 className="absolute right-3 top-[42px] w-4 h-4 text-primary-500 animate-spin pointer-events-none" />
            ) : (
              <ChevronDown className="absolute right-3 top-[42px] w-4 h-4 text-gray-400 pointer-events-none" />
            )}
          </div>

          {/* Nesil / Generation */}
          <div className="relative">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="gen-select">
              Model / Nesil
            </label>
            <select
              id="gen-select"
              value={generationSlug}
              onChange={(e) => handleGenerationChange(e.target.value)}
              disabled={!brandSlug || loadingGenerations}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed pr-10"
            >
              <option value="">
                {loadingGenerations
                  ? 'Yükleniyor...'
                  : brandSlug
                  ? 'Nesil Seçin'
                  : 'Önce Marka Seçin'}
              </option>
              {generations.map((g) => (
                <option key={g.generation_slug} value={g.generation_slug}>
                  {g.generation_name}
                  {g.part_count > 0 ? ` (${g.part_count.toLocaleString('tr-TR')} parça)` : ''}
                </option>
              ))}
            </select>
            {loadingGenerations ? (
              <Loader2 className="absolute right-3 top-[42px] w-4 h-4 text-primary-500 animate-spin pointer-events-none" />
            ) : (
              <ChevronDown className="absolute right-3 top-[42px] w-4 h-4 text-gray-400 pointer-events-none" />
            )}
          </div>

          {/* Takma Ad */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="nickname-input">
              Takma Ad{' '}
              <span className="text-gray-400 font-normal">(opsiyonel)</span>
            </label>
            <input
              id="nickname-input"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Örn: Ailemin arabası"
              maxLength={100}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !brandSlug || !generationSlug}
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {isSubmitting ? 'Ekleniyor...' : 'Garaja Ekle'}
          </button>
        </form>
      </div>
    </div>
  )
}
