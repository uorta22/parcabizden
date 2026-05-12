'use client'

/**
 * VehiclePickerModal — otoparcasan tarzı 3 adımlı araç seçici modal.
 *
 * Sol: 3 adımlı dikey stepper (Marka / Model / Varyant)
 * Sağ: aktif adımın filtrelenebilir grid/listesi
 * Üst: başlık + filtre input
 * Alt: Sıfırla + Araç Seç (vehicle hub'a gider)
 *
 * Hero'daki "Araç ile bul" tab'ından açılır.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Search, ArrowRight, Loader2 } from 'lucide-react'
import {
  getTecBrands, getTecModels, getTecVehicles,
  type TecBrand, type TecModel, type TecVehicle,
} from '@/lib/tecdoc'
import { BrandLogo } from '@/components/BrandLogos'

const ACCENT = '#ff7a1a'

type Step = 1 | 2 | 3

const BRAND_LOGO_ALIASES: Record<string, string> = {
  Vw: 'Volkswagen', Bmw: 'BMW', Amc: 'AMC', Gmc: 'GMC', Mini: 'Mini',
  Seat: 'Seat', Ssangyong: 'SsangYong', 'Mercedes-Benz': 'Mercedes-Benz',
  'Land Rover': 'Land Rover', 'Rolls-Royce': 'Rolls-Royce',
}
function brandLogoKey(name: string): string {
  const stripped = name.normalize('NFD').replace(/[̀-ͯ]/g, '')
  const titled = stripped.toLowerCase().replace(/(^|\s|-)\w/g, c => c.toUpperCase())
  return BRAND_LOGO_ALIASES[titled] ?? titled
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function VehiclePickerModal({ open, onClose }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [search, setSearch] = useState('')

  const [brands, setBrands]     = useState<TecBrand[]>([])
  const [models, setModels]     = useState<TecModel[]>([])
  const [vehicles, setVehicles] = useState<TecVehicle[]>([])

  const [brand, setBrand]     = useState<TecBrand | null>(null)
  const [model, setModel]     = useState<TecModel | null>(null)
  const [vehicle, setVehicle] = useState<TecVehicle | null>(null)

  const [loading, setLoading] = useState(false)

  // ── Reset on close ──
  useEffect(() => {
    if (!open) {
      setStep(1); setSearch('')
      setBrand(null); setModel(null); setVehicle(null)
      setModels([]); setVehicles([])
    }
  }, [open])

  // ── Brands on first open ──
  useEffect(() => {
    if (!open || brands.length) return
    setLoading(true)
    getTecBrands().then(setBrands).finally(() => setLoading(false))
  }, [open, brands.length])

  // ── Models on brand change ──
  useEffect(() => {
    if (!brand) { setModels([]); return }
    setLoading(true); setSearch('')
    getTecModels(brand.id).then(setModels).finally(() => setLoading(false))
  }, [brand])

  // ── Vehicles on model change ──
  useEffect(() => {
    if (!model) { setVehicles([]); return }
    setLoading(true); setSearch('')
    getTecVehicles(model.id).then(setVehicles).finally(() => setLoading(false))
  }, [model])

  // ── Filtreli listeler ──
  const visibleBrands = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return brands
    return brands.filter(b => b.name.toLowerCase().includes(q))
  }, [brands, search])

  const visibleModels = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return models
    return models.filter(m => m.name.toLowerCase().includes(q) || (m.full_name?.toLowerCase().includes(q) ?? false))
  }, [models, search])

  const visibleVehicles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return vehicles
    return vehicles.filter(v =>
      (v.description?.toLowerCase().includes(q) ?? false) ||
      (v.engine_codes?.toLowerCase().includes(q) ?? false)
    )
  }, [vehicles, search])

  const canSubmit = !!vehicle
  const submit = () => {
    if (!vehicle) return
    router.push(`/arac/${vehicle.id}`)
    onClose()
  }

  const reset = () => {
    setStep(1); setSearch('')
    setBrand(null); setModel(null); setVehicle(null)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center md:p-6" onClick={onClose}>
      <div
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:max-w-5xl md:rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Aracınıza Uyumlu Parçaları Seçin</h2>
            <p className="mt-0.5 text-xs text-gray-500">Aracınıza ait marka, model gibi detayları girerek araç seçin ve uyumlu parçaları bulun.</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200" aria-label="Kapat">
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sol stepper */}
          <aside className="hidden w-56 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-4 md:block">
            <StepperItem
              num={1} label="Marka"
              status={step === 1 ? 'active' : brand ? 'done' : 'idle'}
              value={brand?.name}
              onClick={() => brand && setStep(1)}
            />
            <Connector done={!!brand} />
            <StepperItem
              num={2} label="Model"
              status={step === 2 ? 'active' : model ? 'done' : 'idle'}
              value={model?.name}
              disabled={!brand}
              onClick={() => model && setStep(2)}
            />
            <Connector done={!!model} />
            <StepperItem
              num={3} label="Varyant"
              status={step === 3 ? 'active' : vehicle ? 'done' : 'idle'}
              value={vehicle?.description ?? (vehicle ? `KType ${vehicle.id}` : undefined)}
              disabled={!model}
              onClick={() => vehicle && setStep(3)}
            />
          </aside>

          {/* Sağ panel */}
          <main className="flex min-w-0 flex-1 flex-col">
            {/* Filtre + başlık */}
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-6 py-3">
              <h3 className="text-sm font-bold text-gray-900">
                {step === 1 && 'Marka Seçiniz'}
                {step === 2 && (brand ? `${brand.name} — Model Seçiniz` : 'Model Seçiniz')}
                {step === 3 && (model ? `${model.name} — Varyant Seçiniz` : 'Varyant Seçiniz')}
              </h3>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Filtrele.."
                  className="h-9 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-xs outline-none focus:border-[#ff7a1a]"
                />
              </div>
            </div>

            {/* İçerik */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading && (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}

              {/* Step 1 — markalar */}
              {!loading && step === 1 && (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {visibleBrands.map(b => (
                    <li key={b.id}>
                      <button
                        onClick={() => { setBrand(b); setModel(null); setVehicle(null); setStep(2) }}
                        className={`group flex w-full items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-left transition-all hover:border-[#ff7a1a]/50 hover:shadow-sm ${
                          brand?.id === b.id ? 'border-[#ff7a1a] ring-2 ring-[#ff7a1a]/20' : 'border-gray-200'
                        }`}
                      >
                        <BrandLogo brand={brandLogoKey(b.name)} size={32} />
                        <span className="text-xs font-semibold text-gray-800">{b.name}</span>
                      </button>
                    </li>
                  ))}
                  {visibleBrands.length === 0 && (
                    <li className="col-span-full py-12 text-center text-xs text-gray-400">Eşleşen marka yok</li>
                  )}
                </ul>
              )}

              {/* Step 2 — modeller */}
              {!loading && step === 2 && (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {visibleModels.map(m => (
                    <li key={m.id}>
                      <button
                        onClick={() => { setModel(m); setVehicle(null); setStep(3) }}
                        className={`group flex w-full items-baseline justify-between gap-2 rounded-lg border bg-white px-4 py-3 text-left transition-all hover:border-[#ff7a1a]/50 hover:shadow-sm ${
                          model?.id === m.id ? 'border-[#ff7a1a] ring-2 ring-[#ff7a1a]/20' : 'border-gray-200'
                        }`}
                      >
                        <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                        {m.year_range && <span className="flex-shrink-0 text-[10px] text-gray-400">{m.year_range}</span>}
                      </button>
                    </li>
                  ))}
                  {visibleModels.length === 0 && (
                    <li className="col-span-full py-12 text-center text-xs text-gray-400">
                      {brand ? 'Eşleşen model yok' : 'Önce marka seçin'}
                    </li>
                  )}
                </ul>
              )}

              {/* Step 3 — varyantlar */}
              {!loading && step === 3 && (
                <ul className="space-y-2">
                  {visibleVehicles.map(v => {
                    const yr = v.year_from ? `${v.year_from}${v.year_to ? `–${v.year_to}` : '+'}` : ''
                    return (
                      <li key={v.id}>
                        <button
                          onClick={() => setVehicle(v)}
                          className={`group flex w-full items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 text-left transition-all hover:border-[#ff7a1a]/50 hover:shadow-sm ${
                            vehicle?.id === v.id ? 'border-[#ff7a1a] ring-2 ring-[#ff7a1a]/20' : 'border-gray-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-gray-900">
                              {v.description ?? `KType ${v.id}`}
                            </div>
                            {(v.engine_codes || yr) && (
                              <div className="mt-0.5 text-[11px] text-gray-500">
                                {v.engine_codes && <span className="font-mono">{v.engine_codes}</span>}
                                {v.engine_codes && yr && <span className="mx-1.5">·</span>}
                                {yr}
                              </div>
                            )}
                          </div>
                          {vehicle?.id === v.id && (
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white" style={{ background: ACCENT }}>
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                  {visibleVehicles.length === 0 && (
                    <li className="py-12 text-center text-xs text-gray-400">
                      {model ? 'Eşleşen varyant yok' : 'Önce model seçin'}
                    </li>
                  )}
                </ul>
              )}
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-6 py-3">
          <button
            onClick={reset}
            disabled={!brand}
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-600 disabled:opacity-50"
          >
            Sıfırla
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-md px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: ACCENT }}
          >
            Aracı Seç <ArrowRight className="h-4 w-4" />
          </button>
        </footer>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Stepper item
// ─────────────────────────────────────────────────────────
function StepperItem({
  num, label, status, value, disabled, onClick,
}: {
  num: number
  label: string
  status: 'idle' | 'active' | 'done'
  value?: string
  disabled?: boolean
  onClick?: () => void
}) {
  const isActive = status === 'active'
  const isDone   = status === 'done'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-white'
      }`}
    >
      <span
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isActive ? 'text-white' :
          isDone   ? 'bg-emerald-500 text-white' :
                     'border border-gray-300 bg-white text-gray-400'
        }`}
        style={isActive ? { background: ACCENT } : undefined}
      >
        {isDone ? <Check className="h-3.5 w-3.5" /> : num}
      </span>
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-bold ${isActive ? 'text-[#ff7a1a]' : 'text-gray-900'}`}>
          {label}
        </div>
        <div className="truncate text-[10px] text-gray-500">
          {isActive ? 'Seçiliyor' : value || 'Seçilmedi'}
        </div>
      </div>
    </button>
  )
}

function Connector({ done }: { done: boolean }) {
  return <div className={`ml-4 h-4 w-px ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />
}
