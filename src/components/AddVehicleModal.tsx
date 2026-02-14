'use client'

import { useState, useEffect } from 'react'
import { X, Plus, ChevronDown, Loader2 } from 'lucide-react'
import * as api from '@/lib/api'
import type { Brand, Model, Segment } from '@/types/api'

interface AddVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: {
    brand_id: number
    model_id: number
    segment_id?: number
    year: number
    nickname?: string
  }) => Promise<void>
}

export default function AddVehicleModal({ isOpen, onClose, onAdd }: AddVehicleModalProps) {
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [years, setYears] = useState<number[]>([])

  const [brandId, setBrandId] = useState(0)
  const [modelId, setModelId] = useState(0)
  const [segmentId, setSegmentId] = useState(0)
  const [year, setYear] = useState(0)
  const [nickname, setNickname] = useState('')

  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loadingSegments, setLoadingSegments] = useState(false)
  const [loadingYears, setLoadingYears] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Load brands when modal opens
  useEffect(() => {
    if (!isOpen) return
    if (brands.length > 0) return
    setLoadingBrands(true)
    api.getBrands()
      .then(setBrands)
      .catch(() => {})
      .finally(() => setLoadingBrands(false))
  }, [isOpen, brands.length])

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

  if (!isOpen) return null

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

  const formatSegmentLabel = (seg: Segment) => {
    const parts = [seg.name]
    if (seg.engine_type) parts.push(seg.engine_type)
    if (seg.body_type) parts.push(seg.body_type)
    return parts.join(' - ')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!brandId || !modelId || !year) {
      setError('Marka, model ve yıl seçimi gerekli')
      return
    }

    setIsSubmitting(true)
    try {
      await onAdd({
        brand_id: brandId,
        model_id: modelId,
        segment_id: segmentId || undefined,
        year,
        nickname: nickname || undefined,
      })
      onClose()
      setBrandId(0)
      setModelId(0)
      setSegmentId(0)
      setYear(0)
      setNickname('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Araç eklenemedi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-800 border border-dark-700 rounded-2xl p-6 md:p-8 w-full max-w-md animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Modalı kapat"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="modal-title" className="text-xl font-bold text-white mb-6">Araç Ekle</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Marka */}
          <div className="relative">
            <label className="block text-gray-300 text-sm font-medium mb-2">Marka</label>
            <select
              value={brandId}
              onChange={(e) => handleBrandChange(Number(e.target.value))}
              disabled={loadingBrands}
              className="w-full appearance-none bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-40"
            >
              <option value={0}>{loadingBrands ? 'Yükleniyor...' : 'Marka Seçin'}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {loadingBrands ? (
              <Loader2 className="absolute right-3 bottom-3.5 w-4 h-4 text-primary-500 animate-spin pointer-events-none" />
            ) : (
              <ChevronDown className="absolute right-3 bottom-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
            )}
          </div>

          {/* Model */}
          <div className="relative">
            <label className="block text-gray-300 text-sm font-medium mb-2">Model</label>
            <select
              value={modelId}
              onChange={(e) => handleModelChange(Number(e.target.value))}
              disabled={!brandId || loadingModels}
              className="w-full appearance-none bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-40"
            >
              <option value={0}>{loadingModels ? 'Yükleniyor...' : 'Model Seçin'}</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {loadingModels ? (
              <Loader2 className="absolute right-3 bottom-3.5 w-4 h-4 text-primary-500 animate-spin pointer-events-none" />
            ) : (
              <ChevronDown className="absolute right-3 bottom-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
            )}
          </div>

          {/* Segment (Motor / Kasa Tipi) */}
          <div className="relative">
            <label className="block text-gray-300 text-sm font-medium mb-2">Motor / Kasa Tipi</label>
            <select
              value={segmentId}
              onChange={(e) => handleSegmentChange(Number(e.target.value))}
              disabled={!modelId || loadingSegments}
              className="w-full appearance-none bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-40"
            >
              <option value={0}>{loadingSegments ? 'Yükleniyor...' : 'Motor / Kasa Tipi Seçin'}</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>{formatSegmentLabel(s)}</option>
              ))}
            </select>
            {loadingSegments ? (
              <Loader2 className="absolute right-3 bottom-3.5 w-4 h-4 text-primary-500 animate-spin pointer-events-none" />
            ) : (
              <ChevronDown className="absolute right-3 bottom-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
            )}
          </div>

          {/* Yıl */}
          <div className="relative">
            <label className="block text-gray-300 text-sm font-medium mb-2">Yıl</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={!segmentId || loadingYears}
              className="w-full appearance-none bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors disabled:opacity-40"
            >
              <option value={0}>{loadingYears ? 'Yükleniyor...' : 'Yıl Seçin'}</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {loadingYears ? (
              <Loader2 className="absolute right-3 bottom-3.5 w-4 h-4 text-primary-500 animate-spin pointer-events-none" />
            ) : (
              <ChevronDown className="absolute right-3 bottom-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
            )}
          </div>

          {/* Takma Ad */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Takma Ad (Opsiyonel)</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Örn: Ailemin arabası"
              className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-dark-900 font-semibold rounded-lg transition-all mt-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Garaja Ekle
          </button>
        </form>
      </div>
    </div>
  )
}
