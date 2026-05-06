'use client'

/**
 * AddVehicleTecDoc — Garaj akışı için TecDoc tabanlı araç ekleme modal'ı.
 *
 * Akış: Marka → Model → Varyant (KType) → opsiyonel plaka/sase/lakap → ekle.
 *
 * Eski AddVehicleModal'ın yerini alır. ID-bazlı (manufacturer_id, model_id,
 * vehicle_id_ktype) kayıt — backend slug fallback'leri kendisi türetir.
 */

import { useEffect, useMemo, useState } from 'react'
import { X, Loader2, ChevronDown, Check, AlertCircle } from 'lucide-react'
import {
  getTecBrands, getTecModels, getTecVehicles,
  type TecBrand, type TecModel, type TecVehicle,
} from '@/lib/tecdoc'
import { garageAdd } from '@/lib/api'

interface Props {
  open: boolean
  onClose: () => void
  onAdded?: () => void   // Listeyi yenilemek için
}

export default function AddVehicleTecDoc({ open, onClose, onAdded }: Props) {
  const [brands, setBrands]     = useState<TecBrand[]>([])
  const [models, setModels]     = useState<TecModel[]>([])
  const [vehicles, setVehicles] = useState<TecVehicle[]>([])

  const [brandId, setBrandId]     = useState<number | null>(null)
  const [modelId, setModelId]     = useState<number | null>(null)
  const [vehicleId, setVehicleId] = useState<number | null>(null)

  const [lb, setLB] = useState(false)
  const [lm, setLM] = useState(false)
  const [lv, setLV] = useState(false)

  const [nickname, setNickname] = useState('')
  const [plaka, setPlaka]       = useState('')
  const [saseNo, setSaseNo]     = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // Reset on close
  useEffect(() => {
    if (!open) {
      setBrandId(null); setModelId(null); setVehicleId(null)
      setModels([]); setVehicles([])
      setNickname(''); setPlaka(''); setSaseNo('')
      setError(null)
    }
  }, [open])

  // Brands — modal açıldığında bir kez yükle
  useEffect(() => {
    if (!open || brands.length > 0) return
    setLB(true); setError(null)
    getTecBrands()
      .then(setBrands)
      .catch(e => setError(e.message))
      .finally(() => setLB(false))
  }, [open, brands.length])

  // Models — brand değişince
  useEffect(() => {
    if (!brandId) { setModels([]); return }
    setLM(true); setError(null); setModelId(null); setVehicles([]); setVehicleId(null)
    getTecModels(brandId)
      .then(setModels)
      .catch(e => setError(e.message))
      .finally(() => setLM(false))
  }, [brandId])

  // Vehicles — model değişince
  useEffect(() => {
    if (!modelId) { setVehicles([]); return }
    setLV(true); setError(null); setVehicleId(null)
    getTecVehicles(modelId)
      .then(setVehicles)
      .catch(e => setError(e.message))
      .finally(() => setLV(false))
  }, [modelId])

  const selectedBrand   = useMemo(() => brands.find(b => b.id === brandId),   [brands, brandId])
  const selectedModel   = useMemo(() => models.find(m => m.id === modelId),   [models, modelId])
  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === vehicleId), [vehicles, vehicleId])

  const canSubmit = !!(brandId && modelId && vehicleId) && !submitting

  const submit = async () => {
    if (!canSubmit || !selectedBrand || !selectedModel || !selectedVehicle) return
    setSubmitting(true); setError(null)
    try {
      await garageAdd({
        manufacturer_id:  selectedBrand.id,
        model_id:         selectedModel.id,
        vehicle_id_ktype: selectedVehicle.id,
        brand_name:       selectedBrand.name,
        model_name:       selectedModel.name,
        generation_name:  selectedVehicle.description ?? `KType ${selectedVehicle.id}`,
        year:             selectedVehicle.year_from ?? undefined,
        nickname:         nickname.trim() || undefined,
        plaka:            plaka.trim() || undefined,
        sase_no:          saseNo.trim() || undefined,
      })
      onAdded?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Araç eklenirken bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Garaja araç ekle</h2>
            <p className="text-xs text-gray-500">Marka, model ve varyantınızı seçin</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <SelectField
            label="Marka"
            value={brandId ?? ''}
            onChange={v => setBrandId(v ? Number(v) : null)}
            disabled={lb}
            loading={lb}
            placeholder="Marka seçin"
            options={brands.map(b => ({ value: b.id, label: b.name }))}
          />
          <SelectField
            label="Model"
            value={modelId ?? ''}
            onChange={v => setModelId(v ? Number(v) : null)}
            disabled={!brandId || lm}
            loading={lm}
            placeholder={!brandId ? 'Önce marka seçin' : 'Model seçin'}
            options={models.map(m => ({ value: m.id, label: m.year_range ? `${m.name} · ${m.year_range}` : m.name }))}
          />
          <SelectField
            label="Varyant"
            value={vehicleId ?? ''}
            onChange={v => setVehicleId(v ? Number(v) : null)}
            disabled={!modelId || lv}
            loading={lv}
            placeholder={!modelId ? 'Önce model seçin' : 'Varyant seçin'}
            options={vehicles.map(v => {
              const year = v.year_from ? ` · ${v.year_from}${v.year_to ? `–${v.year_to}` : '+'}` : ''
              const eng  = v.engine_codes ? ` (${v.engine_codes})` : ''
              return { value: v.id, label: (v.description ?? `KType ${v.id}`) + eng + year }
            })}
          />

          {/* Optional fields */}
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <Input label="Lakap (ops.)"   value={nickname} onChange={setNickname} placeholder="Örn. Babamın arabası" maxLength={40} />
            <Input label="Plaka (ops.)"   value={plaka}    onChange={v => setPlaka(v.toUpperCase())} placeholder="34 ABC 123" maxLength={15} />
          </div>
          <Input label="Şase No (ops.)" value={saseNo}   onChange={v => setSaseNo(v.toUpperCase())} placeholder="WVWZZZ1JZ3W386752" maxLength={17} />
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-bold text-[#0b1120] transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {submitting ? 'Ekleniyor…' : 'Aracı Ekle'}
          </button>
        </footer>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function SelectField({
  label, value, onChange, options, placeholder, disabled, loading,
}: {
  label: string
  value: number | string
  onChange: (v: string) => void
  options: { value: number | string; label: string }[]
  placeholder: string
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <div className="relative">
        <select
          value={String(value)}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="h-11 w-full appearance-none rounded-xl border border-gray-300 bg-white px-3.5 pr-10 text-sm outline-none transition-all
            focus:border-primary-500 focus:ring-2 focus:ring-primary-200
            disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">{placeholder}</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </div>
    </label>
  )
}

function Input({
  label, value, onChange, placeholder, maxLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
      />
    </label>
  )
}
