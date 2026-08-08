'use client'

/**
 * Talep Aç — alıcının aracını ve aradığı parçaları tarif ederek satıcılardan
 * teklif istediği form.
 *
 * Ürün kararı: talep ÜYELİKSİZ açılabilir, tek zorunlu kimlik telefon
 * numarasıdır (rakiplerin üyelik + adres + TC kimlik zorunluluğu burada
 * sürtünme kaynağı). Giriş yapmış kullanıcıdan da telefon istenir ama
 * profilinden ön doldurulur.
 *
 * Bir talep birden çok parça satırı içerebilir (1-10) — kullanıcı 3 parça
 * arıyorsa 3 ayrı talep açmaz, tek talebe 3 satır ekler.
 *
 * Araç seçimi VehiclePickerModal ile yapılır (bkz. app/ilan-ver/page.tsx).
 * Aracını bilmeyen kullanıcı için şase no / serbest metin ile manuel giriş
 * alternatifi vardır.
 */

import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  Send, Plus, Trash2, Car, Loader2, AlertCircle, ShieldCheck, Users, Wallet,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchCities, type GeoCity } from '@/lib/api'
import { createRequest } from '@/lib/requests'
import VehiclePickerModal, { type VehicleSelection } from '@/components/landing/VehiclePickerModal'

const MAX_ITEMS = 10

// İlan Ver / Mağaza Aç formlarındaki alan stiliyle aynı.
const INPUT =
  'w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 ' +
  'placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors ' +
  'disabled:bg-gray-50 disabled:text-gray-400'

interface PartItemState {
  id: string
  partLabel: string
  quantity: string
  oemNumber: string
  note: string
}

function newItem(): PartItemState {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, partLabel: '', quantity: '', oemNumber: '', note: '' }
}

/** "05XX XXX XX XX" / "+90 5XX..." gibi girişleri 10 haneli (5XXXXXXXXX) forma indirger. */
function normalizePhoneDigits(v: string): string {
  let d = v.replace(/\D/g, '')
  if (d.startsWith('90') && d.length === 12) d = d.slice(2)
  if (d.startsWith('0') && d.length === 11) d = d.slice(1)
  return d
}

function isValidTrMobile(v: string): boolean {
  return /^5\d{9}$/.test(normalizePhoneDigits(v))
}

/** "1.234,56" veya "1234.56" gibi girişleri sayıya çevirir. */
function parseDecimal(v: string): number | null {
  const norm = v.trim().replace(',', '.')
  if (!norm) return null
  const n = Number(norm)
  return Number.isFinite(n) && n > 0 ? n : null
}

export default function TalepAcPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // ── İletişim ──
  const [phone, setPhone] = useState('')
  const [phonePrefilled, setPhonePrefilled] = useState(false)

  useEffect(() => {
    if (authLoading || phonePrefilled) return
    if (user?.phone) {
      setPhone(user.phone)
      setPhonePrefilled(true)
    }
  }, [authLoading, user, phonePrefilled])

  // ── Şehir ──
  const [cities, setCities] = useState<GeoCity[]>([])
  const [cityId, setCityId] = useState('')

  useEffect(() => {
    fetchCities().then(r => setCities(r.cities)).catch(() => {})
  }, [])

  // ── Araç (opsiyonel) ──
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selection, setSelection] = useState<VehicleSelection | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [vehicleLabelManual, setVehicleLabelManual] = useState('')
  const [vin, setVin] = useState('')
  const [engineNumber, setEngineNumber] = useState('')

  const openPicker = () => { setManualMode(false); setPickerOpen(true) }
  const handleVehicleSelect = (sel: VehicleSelection) => setSelection(sel)
  const removeVehicle = () => setSelection(null)
  const startManual = () => { setSelection(null); setManualMode(true) }
  const cancelManual = () => { setManualMode(false); setVehicleLabelManual('') }

  // ── Bütçe ──
  const [budgetMax, setBudgetMax] = useState('')

  // ── Parça satırları ──
  const [items, setItems] = useState<PartItemState[]>([newItem()])

  const addItem = () => setItems(prev => (prev.length >= MAX_ITEMS ? prev : [...prev, newItem()]))
  const removeItem = (id: string) => setItems(prev => (prev.length <= 1 ? prev : prev.filter(i => i.id !== id)))
  const updateItem = (id: string, patch: Partial<PartItemState>) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)))

  // ── Gönderim ──
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function buildErrors(): Record<string, string> {
    const errors: Record<string, string> = {}

    if (!phone.trim()) errors.phone = 'Telefon numarası zorunlu'
    else if (!isValidTrMobile(phone)) errors.phone = 'Geçerli bir cep telefonu girin (5xx xxx xx xx)'

    if (manualMode && vehicleLabelManual.trim().length > 150) {
      errors.vehicle_label = 'Araç bilgisi en fazla 150 karakter olabilir'
    }

    if (vin.trim() && vin.trim().length !== 17) {
      errors.vin = 'Şase numarası 17 karakter olmalı'
    }

    if (engineNumber.trim().length > 40) {
      errors.engine_number = 'Motor numarası en fazla 40 karakter olabilir'
    }

    if (budgetMax.trim() && parseDecimal(budgetMax) === null) {
      errors.budget_max = 'Geçerli bir bütçe girin'
    }

    items.forEach((item, idx) => {
      const label = item.partLabel.trim()
      if (!label) errors[`item_${idx}_part_label`] = 'Parça adı zorunlu'
      else if (label.length > 150) errors[`item_${idx}_part_label`] = 'Parça adı en fazla 150 karakter olabilir'

      if (item.quantity.trim() && (!/^\d+$/.test(item.quantity.trim()) || Number(item.quantity) < 1)) {
        errors[`item_${idx}_quantity`] = 'Adet pozitif bir tam sayı olmalı'
      }
      if (item.oemNumber.trim().length > 100) errors[`item_${idx}_oem_number`] = 'OEM numarası en fazla 100 karakter olabilir'
      if (item.note.trim().length > 500) errors[`item_${idx}_note`] = 'Not en fazla 500 karakter olabilir'
    })

    return errors
  }

  const liveErrors = useMemo(buildErrors, [
    phone, manualMode, vehicleLabelManual, vin, engineNumber, budgetMax, items,
  ])
  const canSubmit = Object.keys(liveErrors).length === 0 && !submitting

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errors = buildErrors()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setFormError('Lütfen işaretli alanları düzelt')
      return
    }
    setFormError('')
    setSubmitting(true)
    try {
      const vehicleLabel = selection?.label ?? (manualMode && vehicleLabelManual.trim() ? vehicleLabelManual.trim() : undefined)
      const created = await createRequest({
        contact_phone: normalizePhoneDigits(phone),
        city_id: cityId ? Number(cityId) : undefined,
        manufacturer_id: selection?.brand.id,
        model_id: selection?.model.id,
        vehicle_id: selection?.vehicle.id,
        vehicle_label: vehicleLabel,
        vin: vin.trim() ? vin.trim().toUpperCase() : undefined,
        engine_number: engineNumber.trim() || undefined,
        budget_max: budgetMax.trim() ? String(parseDecimal(budgetMax)) : undefined,
        items: items.map(item => ({
          part_label: item.partLabel.trim(),
          quantity: item.quantity.trim() ? Number(item.quantity) : undefined,
          oem_number: item.oemNumber.trim() || undefined,
          note: item.note.trim() || undefined,
        })),
      })
      router.push(`/talep/${created.id}?t=${created.access_token}`)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Talep gönderilemedi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-600">
          <Send className="h-3.5 w-3.5" /> Talep Aç
        </div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Aradığın parçayı satıcılara ilet</h1>
        <p className="mt-2 text-gray-500">
          Aracını ve aradığın parçaları anlat, onaylı satıcılar sana teklif göndersin. Üyelik gerekmez, tek ihtiyacımız
          teklifleri ulaştırabileceğimiz telefon numaran.
        </p>

        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          <li className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
            <ShieldCheck className="h-4 w-4 flex-shrink-0 text-primary-500" /> Ücretsiz ve üyeliksiz
          </li>
          <li className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
            <Users className="h-4 w-4 flex-shrink-0 text-primary-500" /> Onaylı satıcılara ulaşır
          </li>
          <li className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
            <Wallet className="h-4 w-4 flex-shrink-0 text-primary-500" /> Teklifleri karşılaştır, sen seç
          </li>
        </ul>
      </header>

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
        {/* ── İletişim ── */}
        <Field label="Telefon numarası" required hint="Teklifler bu numaraya iletilir · yalnızca satıcılarla paylaşılır" error={fieldErrors.phone}>
          <input
            value={phone} onChange={e => setPhone(e.target.value)}
            inputMode="tel" placeholder="5xx xxx xx xx" className={INPUT}
          />
        </Field>

        <Field label="Şehir" hint="Talebini önce yakın bölgedeki satıcılara ulaştırmamıza yardımcı olur (opsiyonel)">
          <select value={cityId} onChange={e => setCityId(e.target.value)} className={INPUT}>
            <option value="">Seçiniz</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        {/* ── Araç bilgisi (opsiyonel) ── */}
        <div className="rounded-xl border border-gray-200 p-4">
          <span className="mb-1.5 block text-sm font-semibold text-gray-800">Aracın</span>

          {!selection && !manualMode && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-gray-500">Hangi araç için parça arıyorsun?</p>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={openPicker} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-bold text-white hover:bg-primary-400">
                  <Car className="h-4 w-4" /> Araç Seç
                </button>
                <button type="button" onClick={startManual} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Aracımı bilmiyorum / şase ile gireceğim
                </button>
              </div>
            </div>
          )}

          {selection && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <Car className="h-4 w-4 flex-shrink-0 text-primary-500" />
                <span className="truncate text-sm font-semibold text-gray-900">{selection.label}</span>
              </div>
              <div className="flex flex-shrink-0 gap-3">
                <button type="button" onClick={openPicker} className="text-xs font-semibold text-primary-600 hover:text-primary-500">
                  Değiştir
                </button>
                <button type="button" onClick={removeVehicle} className="text-xs font-semibold text-gray-400 hover:text-gray-600">
                  Kaldır
                </button>
              </div>
            </div>
          )}

          {manualMode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
                <span>Araç bilgisini serbest metin veya şase no ile gir.</span>
                <button type="button" onClick={cancelManual} className="flex-shrink-0 font-semibold text-primary-500 hover:text-primary-400">
                  Vazgeç, listeden seçeyim
                </button>
              </div>
              <Field label="Araç" hint="Örn. 2015 model Renault Clio 1.5 dCi (opsiyonel)" error={fieldErrors.vehicle_label}>
                <input
                  value={vehicleLabelManual} onChange={e => setVehicleLabelManual(e.target.value)}
                  placeholder="2015 model Renault Clio 1.5 dCi" className={INPUT} maxLength={150}
                />
              </Field>
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Şase numarası (VIN)" hint="17 haneli · biliyorsan uyumluluğu netleştirir (opsiyonel)" error={fieldErrors.vin}>
              <input
                value={vin} onChange={e => setVin(e.target.value.toUpperCase().slice(0, 17))}
                placeholder="Örn. WVWZZZ1KZAW000000" className={`${INPUT} font-mono`}
              />
            </Field>
            <Field label="Motor numarası" hint="Opsiyonel" error={fieldErrors.engine_number}>
              <input
                value={engineNumber} onChange={e => setEngineNumber(e.target.value)}
                placeholder="Opsiyonel" className={INPUT} maxLength={40}
              />
            </Field>
          </div>
        </div>

        {/* ── Bütçe ── */}
        <Field label="Bütçe üst sınırı" hint="Teklifleri bu tutarın altında görmek istiyorsan belirt (opsiyonel)" error={fieldErrors.budget_max}>
          <input
            value={budgetMax} onChange={e => setBudgetMax(e.target.value)}
            inputMode="decimal" placeholder="Örn. 1500" className={INPUT}
          />
        </Field>

        {/* ── Parça satırları ── */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="block text-sm font-semibold text-gray-800">
              Aradığın parçalar <span className="text-primary-500">*</span>
            </span>
            <span className="text-xs text-gray-400">{items.length} / {MAX_ITEMS}</span>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Parça {idx + 1}</span>
                  {idx > 0 && (
                    <button
                      type="button" onClick={() => removeItem(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Kaldır
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <Field label="Parça adı" required error={fieldErrors[`item_${idx}_part_label`]}>
                    <input
                      value={item.partLabel} onChange={e => updateItem(item.id, { partLabel: e.target.value })}
                      placeholder="Örn. Sağ Arka Stop Lambası" className={INPUT} maxLength={150}
                    />
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Adet" hint="Varsayılan 1" error={fieldErrors[`item_${idx}_quantity`]}>
                      <input
                        value={item.quantity} onChange={e => updateItem(item.id, { quantity: e.target.value.replace(/\D/g, '') })}
                        inputMode="numeric" placeholder="1" className={INPUT}
                      />
                    </Field>
                    <Field label="OEM numarası" hint="Opsiyonel" error={fieldErrors[`item_${idx}_oem_number`]}>
                      <input
                        value={item.oemNumber} onChange={e => updateItem(item.id, { oemNumber: e.target.value })}
                        placeholder="Örn. 63217162565" className={INPUT} maxLength={100}
                      />
                    </Field>
                  </div>

                  <Field label="Not" hint="Renk, hasar durumu, aciliyet gibi detaylar (opsiyonel)" error={fieldErrors[`item_${idx}_note`]}>
                    <textarea
                      value={item.note} onChange={e => updateItem(item.id, { note: e.target.value })}
                      rows={2} maxLength={500} className={`${INPUT} resize-none`}
                      placeholder="Ek detay eklemek istersen buraya yaz"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>

          {items.length < MAX_ITEMS && (
            <button
              type="button" onClick={addItem}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:border-primary-400 hover:bg-primary-50/40"
            >
              <Plus className="h-4 w-4" /> Başka parça ekle
            </button>
          )}
        </div>

        {formError && (
          <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {formError}
          </p>
        )}

        <button
          type="submit" disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-4 text-base font-black uppercase tracking-wider text-white transition-all hover:bg-primary-400 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          {submitting ? 'Gönderiliyor…' : 'Talebi Gönder'}
        </button>
      </form>

      <VehiclePickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleVehicleSelect} />
    </main>
  )
}

function Field({
  label, required, hint, error, children,
}: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-800">
        {label} {required && <span className="text-primary-500">*</span>}
      </span>
      {children}
      {error ? <FieldError text={error} /> : hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  )
}

function FieldError({ text }: { text?: string }) {
  if (!text) return null
  return <span className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle className="h-3 w-3" /> {text}</span>
}
