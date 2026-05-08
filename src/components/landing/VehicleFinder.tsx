'use client'

/**
 * VehicleFinder — autodoc tarzı 3 katmanlı araç seçici.
 *
 * Marka → Model → Varyant (KType) zinciriyle TecDoc kataloğundan
 * besleniyor. Kullanıcı son adımı seçince /parcalar?brand=X&model=Y
 * &vehicle=Z URL'ine yönlendirilir; orada kategori + parça akışı açılır.
 *
 * Tasarım:
 *  • Karanlık hero üzerinde camsı kart, 3 sütunlu select grid
 *  • Sonraki dropdown önceki seçimsiz disabled (görsel + işlevsel)
 *  • Yükleme durumu select içinde inline; spinner gerekmez
 *  • Tek primary CTA: 'Parçaları Listele'
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Loader2, ArrowRight } from 'lucide-react'
import { getTecBrands, getTecModels, getTecVehicles, type TecBrand, type TecModel, type TecVehicle } from '@/lib/tecdoc'

export default function VehicleFinder() {
  const router = useRouter()

  const [brands, setBrands] = useState<TecBrand[]>([])
  const [models, setModels] = useState<TecModel[]>([])
  const [vehicles, setVehicles] = useState<TecVehicle[]>([])

  const [brandId, setBrandId]     = useState<number | null>(null)
  const [modelId, setModelId]     = useState<number | null>(null)
  const [vehicleId, setVehicleId] = useState<number | null>(null)

  const [loadingBrands, setLB]    = useState(true)
  const [loadingModels, setLM]    = useState(false)
  const [loadingVehicles, setLV]  = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // ── 1) Markalar ──
  useEffect(() => {
    let cancelled = false
    getTecBrands()
      .then(b => { if (!cancelled) setBrands(b) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLB(false) })
    return () => { cancelled = true }
  }, [])

  // ── 2) Modeller ──
  useEffect(() => {
    if (!brandId) { setModels([]); setModelId(null); setVehicles([]); setVehicleId(null); return }
    setLM(true); setError(null); setModelId(null); setVehicles([]); setVehicleId(null)
    let cancelled = false
    getTecModels(brandId)
      .then(m => { if (!cancelled) setModels(m) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLM(false) })
    return () => { cancelled = true }
  }, [brandId])

  // ── 3) Varyantlar ──
  useEffect(() => {
    if (!modelId) { setVehicles([]); setVehicleId(null); return }
    setLV(true); setError(null); setVehicleId(null)
    let cancelled = false
    getTecVehicles(modelId)
      .then(v => { if (!cancelled) setVehicles(v) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLV(false) })
    return () => { cancelled = true }
  }, [modelId])

  const canSubmit = brandId && modelId && vehicleId
  const submit = () => {
    if (!canSubmit) return
    // Önce vehicle hub kartı; oradan kullanıcı 'Yedek Parçalar'a giderek
    // /parcalar?vehicle=KType akışına geçer.
    router.push(`/arac/${vehicleId}`)
  }

  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md md:p-4"
      style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
    >
      <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
        {/* Marka */}
        <Select
          value={brandId ?? ''}
          onChange={v => setBrandId(v ? Number(v) : null)}
          disabled={loadingBrands}
          loading={loadingBrands}
          placeholder="Marka seçin"
          options={brands.map(b => ({ value: b.id, label: b.name }))}
          ariaLabel="Marka"
        />

        {/* Model */}
        <Select
          value={modelId ?? ''}
          onChange={v => setModelId(v ? Number(v) : null)}
          disabled={!brandId || loadingModels}
          loading={loadingModels}
          placeholder={!brandId ? 'Önce marka' : 'Model seçin'}
          options={models.map(m => ({ value: m.id, label: m.year_range ? `${m.name} · ${m.year_range}` : m.name }))}
          ariaLabel="Model"
        />

        {/* Varyant */}
        <Select
          value={vehicleId ?? ''}
          onChange={v => setVehicleId(v ? Number(v) : null)}
          disabled={!modelId || loadingVehicles}
          loading={loadingVehicles}
          placeholder={!modelId ? 'Önce model' : 'Varyant seçin'}
          options={vehicles.map(v => {
            const year = v.year_from ? `${v.year_from}${v.year_to ? `–${v.year_to}` : '+'}` : ''
            const label = [v.description, v.engine_codes ? `(${v.engine_codes})` : '', year]
              .filter(Boolean).join(' · ')
            return { value: v.id, label: label || `KType ${v.id}` }
          })}
          ariaLabel="Varyant"
        />

        {/* Submit */}
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 font-bold text-[#0b1120] transition-all hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-40 md:h-auto"
        >
          Parçaları Listele
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Sade native select — koyu hero üzerinde camsı görünüm
// ─────────────────────────────────────────────────────────
function Select({
  value, onChange, options, placeholder, disabled, loading, ariaLabel,
}: {
  value: number | string
  onChange: (v: string) => void
  options: { value: number | string; label: string }[]
  placeholder: string
  disabled?: boolean
  loading?: boolean
  ariaLabel: string
}) {
  return (
    <div className="relative">
      <select
        value={String(value)}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.06] px-4 pr-10 text-sm text-white outline-none transition-all
          focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20
          disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <option value="" className="bg-[#0b1120] text-white">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-[#0b1120] text-white">
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
      </span>
    </div>
  )
}
