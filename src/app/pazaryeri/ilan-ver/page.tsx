'use client'

/**
 * İlan Ver — onaylı satıcının parça ilanı açtığı form.
 *
 * Akış: giriş yoksa /girişe yönlendirilir → mağaza yoksa/onaylı değilse
 * bilgilendirme gösterilir → onaylı satıcı formu doldurur → başvuru
 * 'pending_review' olarak kaydedilir, ilan sayfasına yönlendirilir.
 *
 * Araç seçimi VehiclePickerModal ile yapılır. Modal `onSelect` verildiğinde
 * yönlendirme yapmıyor, seçimi callback'e döndürüp kendini kapatıyor — bu
 * sayede seçilen marka/model/varyant id'leri doldurulmuş formu kaybetmeden
 * bu sayfada state'e yazılabiliyor.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Tag, Store, Upload, X, ChevronLeft, ChevronRight, Loader2, AlertCircle,
  Clock, XCircle, Car,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchMySeller, type SellerProfile } from '@/lib/api'
import { createListing, type ConditionType, type ShippingPayer } from '@/lib/listings'
import { PART_CATEGORY_GROUPS } from '@/lib/part-categories'
import VehiclePickerModal, { type VehicleSelection } from '@/components/landing/VehiclePickerModal'

const MAX_IMAGES = 8
const MAX_IMAGE_MB = 5
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Giriş/kayıt ve mağaza-aç formlarındaki alan stiliyle aynı.
const INPUT =
  'w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 ' +
  'placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors ' +
  'disabled:bg-gray-50 disabled:text-gray-400'

const CONDITIONS: { value: ConditionType; label: string }[] = [
  { value: 'cikma', label: 'Çıkma' },
  { value: 'sifir', label: 'Sıfır' },
  { value: 'yenilenmis', label: 'Yenilenmiş' },
]

const SHIPPING_OPTIONS: { value: ShippingPayer; label: string }[] = [
  { value: 'buyer', label: 'Alıcı öder' },
  { value: 'seller', label: 'Satıcı öder' },
  { value: 'negotiable', label: 'Pazarlık edilir' },
]

type PriceMode = 'exact' | 'range'

interface ImageItem { id: string; file: File; url: string }

/** "1.234,56" veya "1234.56" gibi girişleri sayıya çevirir. */
function parseDecimal(v: string): number | null {
  const norm = v.trim().replace(',', '.')
  if (!norm) return null
  const n = Number(norm)
  return Number.isFinite(n) && n > 0 ? n : null
}

export default function IlanVerPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [seller, setSeller] = useState<SellerProfile | null>(null)
  const [checkingSeller, setCheckingSeller] = useState(true)

  // Giriş yoksa /girişe yönlendir.
  useEffect(() => {
    if (!authLoading && !user) router.replace('/giris')
  }, [authLoading, user, router])

  useEffect(() => {
    if (authLoading || !user) return
    fetchMySeller()
      .then(r => setSeller(r.seller))
      .catch(() => setSeller(null))
      .finally(() => setCheckingSeller(false))
  }, [authLoading, user])

  if (authLoading || !user || checkingSeller) {
    return (
      <main className="container mx-auto flex max-w-3xl items-center justify-center px-4 py-24">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </main>
    )
  }

  if (!seller || seller.status !== 'approved') return <SellerGate seller={seller} />

  return <ListingForm />
}

function SellerGate({ seller }: { seller: SellerProfile | null }) {
  const view = !seller
    ? { Icon: Store, title: 'Önce mağaza açmalısın', body: 'İlan verebilmek için önce ücretsiz satıcı başvurunu tamamlaman gerekiyor.' }
    : seller.status === 'pending'
    ? { Icon: Clock, title: 'Başvurun inceleniyor', body: 'Vergi levhan kontrol ediliyor. Onaylandığında ilan vermeye başlayabilirsin.' }
    : { Icon: XCircle, title: seller.status === 'rejected' ? 'Başvurun reddedildi' : 'Mağazan askıya alındı', body: seller.rejection_reason || 'Mağaza durumunla ilgili detaylar için başvuru sayfana bak.' }

  return (
    <main className="container mx-auto max-w-lg px-4 py-24 text-center">
      <view.Icon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
      <h1 className="text-2xl font-black text-gray-900">{view.title}</h1>
      <p className="mt-2 text-gray-500">{view.body}</p>
      <div className="mt-6 flex justify-center">
        <Link href="/basvuru" className="rounded-xl bg-primary-500 px-6 py-3 font-bold text-white hover:bg-primary-400">
          {seller ? 'Başvuru Durumunu Gör' : 'Mağaza Aç'}
        </Link>
      </div>
    </main>
  )
}

function ListingForm() {
  const router = useRouter()

  // ── Temel alanlar ──
  const [title, setTitle] = useState('')
  const [partLabel, setPartLabel] = useState('')
  const [conditionType, setConditionType] = useState<ConditionType | ''>('')
  const [oemNumber, setOemNumber] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [shippingPayer, setShippingPayer] = useState<ShippingPayer>('buyer')

  // ── Fiyat ──
  const [priceMode, setPriceMode] = useState<PriceMode>('exact')
  const [price, setPrice] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  // ── Araç seçimi (opsiyonel, VehiclePickerModal ile) ──
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selection, setSelection] = useState<VehicleSelection | null>(null)
  const [vehicleSkipped, setVehicleSkipped] = useState(false)
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')

  const [categorySlug, setCategorySlug] = useState('')

  // ── Fotoğraflar ──
  const [images, setImages] = useState<ImageItem[]>([])
  const [imagesError, setImagesError] = useState('')
  const imagesRef = useRef<ImageItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Gönderim ──
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { imagesRef.current = images }, [images])
  // Unmount olduğunda tüm blob URL'lerini temizle.
  useEffect(() => () => { imagesRef.current.forEach(img => URL.revokeObjectURL(img.url)) }, [])

  // Araç seçilince uyumlu yıl aralığını öner.
  useEffect(() => {
    if (!selection) return
    if (selection.vehicle.year_from) setYearFrom(String(selection.vehicle.year_from))
    if (selection.vehicle.year_to) setYearTo(String(selection.vehicle.year_to))
  }, [selection])

  const openPicker = () => setPickerOpen(true)
  const handleVehicleSelect = (sel: VehicleSelection) => {
    setSelection(sel)
    setVehicleSkipped(false)
  }
  const skipVehicle = () => {
    setVehicleSkipped(true)
    setSelection(null)
  }
  const removeVehicle = () => {
    setSelection(null)
    setVehicleSkipped(false)
  }

  // ── Fotoğraf işlemleri ──
  const onFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const incoming = Array.from(fileList)
    const reasons = new Set<string>()
    const accepted: ImageItem[] = []

    for (const file of incoming) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        reasons.add('Yalnızca JPG, PNG veya WEBP yükleyebilirsiniz')
        continue
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        reasons.add(`Her fotoğraf en fazla ${MAX_IMAGE_MB} MB olabilir`)
        continue
      }
      accepted.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, url: URL.createObjectURL(file) })
    }

    setImages(prev => {
      const merged = [...prev, ...accepted]
      if (merged.length > MAX_IMAGES) {
        reasons.add(`En fazla ${MAX_IMAGES} fotoğraf yükleyebilirsiniz`)
        merged.slice(MAX_IMAGES).forEach(img => URL.revokeObjectURL(img.url))
        return merged.slice(0, MAX_IMAGES)
      }
      return merged
    })
    setImagesError(reasons.size ? Array.from(reasons).join(' · ') : '')
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const target = prev.find(i => i.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter(i => i.id !== id)
    })
  }

  const moveImage = (id: string, dir: -1 | 1) => {
    setImages(prev => {
      const idx = prev.findIndex(i => i.id === id)
      const newIdx = idx + dir
      if (idx === -1 || newIdx < 0 || newIdx >= prev.length) return prev
      const copy = [...prev]
      const [item] = copy.splice(idx, 1)
      copy.splice(newIdx, 0, item)
      return copy
    })
  }

  // ── Doğrulama ──
  function buildErrors(): Record<string, string> {
    const errors: Record<string, string> = {}
    const t = title.trim()
    if (t.length < 10 || t.length > 200) errors.title = 'Başlık 10-200 karakter olmalı'

    const pl = partLabel.trim()
    if (!pl) errors.part_label = 'Parça adı zorunlu'
    else if (pl.length > 150) errors.part_label = 'Parça adı en fazla 150 karakter olabilir'

    if (!conditionType) errors.condition_type = 'Durumu seçin'

    if (priceMode === 'exact') {
      if (parseDecimal(price) === null) errors.price = 'Geçerli bir fiyat girin'
    } else {
      const min = parseDecimal(priceMin)
      const max = parseDecimal(priceMax)
      if (min === null) errors.price_min = 'Geçerli bir alt sınır girin'
      if (max === null) errors.price_max = 'Geçerli bir üst sınır girin'
      if (min !== null && max !== null && min >= max) errors.price_max = 'Üst sınır, alt sınırdan büyük olmalı'
    }

    if (quantity.trim() && (!/^\d+$/.test(quantity.trim()) || Number(quantity) < 1)) {
      errors.quantity = 'Adet pozitif bir tam sayı olmalı'
    }
    if (description.trim().length > 5000) errors.description = 'Açıklama en fazla 5000 karakter olabilir'
    if (oemNumber.trim().length > 100) errors.oem_number = 'OEM numarası en fazla 100 karakter olabilir'

    return errors
  }

  const liveErrors = useMemo(buildErrors, [
    title, partLabel, conditionType, priceMode, price, priceMin, priceMax,
    quantity, description, oemNumber,
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
      const listing = await createListing({
        title: title.trim(),
        part_label: partLabel.trim(),
        condition_type: conditionType as ConditionType,
        price: priceMode === 'exact' ? String(parseDecimal(price)) : undefined,
        price_min: priceMode === 'range' ? String(parseDecimal(priceMin)) : undefined,
        price_max: priceMode === 'range' ? String(parseDecimal(priceMax)) : undefined,
        quantity: quantity.trim() ? Number(quantity) : undefined,
        shipping_payer: shippingPayer,
        description: description.trim() || undefined,
        manufacturer_id: selection?.brand.id,
        model_id: selection?.model.id,
        vehicle_id: selection?.vehicle.id,
        vehicle_label: selection?.label,
        year_from: yearFrom.trim() ? Number(yearFrom) : undefined,
        year_to: yearTo.trim() ? Number(yearTo) : undefined,
        category_slug: categorySlug || undefined,
        oem_number: oemNumber.trim() || undefined,
        images: images.map(i => i.file),
      })
      // Herkese açık ilan sayfası (/ilan/[slug]) alıcı sitesinde ve HENÜZ YOK.
      // Oraya yönlendirmek satıcıyı 404'e düşürüyordu; kendi ilan listesine
      // gönderiyoruz. Sayfa yapıldığında oraya bağlanacak.
      router.push('/ilanlarim')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'İlan gönderilemedi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-600">
          <Tag className="h-3.5 w-3.5" /> İlan Ver
        </div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Parçanı listele</h1>
        <p className="mt-2 text-gray-500">
          Fotoğraf ekle, net bir fiyat veya güven veren bir aralık belirle. Onaydan sonra ilanın yayına girer.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
        <Field label="İlan başlığı" required hint="Alıcının ilk göreceği metin · 10-200 karakter" error={fieldErrors.title}>
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Örn. Sağ Arka Stop Lambası - Orijinal Çıkma"
            className={INPUT} maxLength={200}
          />
        </Field>

        <Field label="Parça adı" required hint="Kısa ve net · örn. Stop Lambası" error={fieldErrors.part_label}>
          <input
            value={partLabel} onChange={e => setPartLabel(e.target.value)}
            placeholder="Stop Lambası" className={INPUT} maxLength={150}
          />
        </Field>

        <Field label="Durum" required error={fieldErrors.condition_type}>
          <div className="grid grid-cols-3 gap-2">
            {CONDITIONS.map(c => (
              <button
                key={c.value} type="button" onClick={() => setConditionType(c.value)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  conditionType === c.value
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </Field>

        {/* ── Araç bilgisi (opsiyonel) ── */}
        <div className="rounded-xl border border-gray-200 p-4">
          <span className="mb-1.5 block text-sm font-semibold text-gray-800">Uyumlu araç</span>

          {!selection && !vehicleSkipped && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-gray-500">Bu parça belirli bir araca mı ait?</p>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={openPicker} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-bold text-white hover:bg-primary-400">
                  <Car className="h-4 w-4" /> Araç Seç
                </button>
                <button type="button" onClick={skipVehicle} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Araç bilgim yok
                </button>
              </div>
            </div>
          )}

          {!selection && vehicleSkipped && (
            <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
              <span>Araç bilgisi olmadan ilan verilecek.</span>
              <button type="button" onClick={openPicker} className="font-semibold text-primary-500 hover:text-primary-400">
                Fikrimi değiştirdim, araç seçeyim
              </button>
            </div>
          )}

          {selection && (
            <div className="space-y-4">
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
            </div>
          )}

          <label className="mt-4 block">
            <span className="mb-1 block text-xs text-gray-500">Kategori</span>
            <select value={categorySlug} onChange={e => setCategorySlug(e.target.value)} className={INPUT}>
              <option value="">Kategori seçin (opsiyonel)</option>
              {PART_CATEGORY_GROUPS.map(g => (
                <optgroup key={g.slug} label={g.title}>
                  {g.items.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                </optgroup>
              ))}
            </select>
          </label>

          {(selection || vehicleSkipped) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-gray-500">Uyumlu yıl (başlangıç)</span>
                <input
                  value={yearFrom} onChange={e => setYearFrom(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric" placeholder="Örn. 2010" className={INPUT}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-gray-500">Uyumlu yıl (bitiş)</span>
                <input
                  value={yearTo} onChange={e => setYearTo(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric" placeholder="Örn. 2015" className={INPUT}
                />
              </label>
            </div>
          )}
        </div>

        <Field label="OEM numarası" hint="Biliyorsan uyumluluğu netleştirir (opsiyonel)" error={fieldErrors.oem_number}>
          <input
            value={oemNumber} onChange={e => setOemNumber(e.target.value)}
            placeholder="Örn. 63217162565" className={INPUT} maxLength={100}
          />
        </Field>

        {/* ── Fiyat ── */}
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-gray-800">
            Fiyat <span className="text-primary-500">*</span>
          </span>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button" onClick={() => setPriceMode('exact')}
              className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                priceMode === 'exact' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              Net fiyat
            </button>
            <button
              type="button" onClick={() => setPriceMode('range')}
              className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                priceMode === 'range' ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              Fiyat aralığı
            </button>
          </div>

          {priceMode === 'exact' ? (
            <input
              value={price} onChange={e => setPrice(e.target.value)}
              inputMode="decimal" placeholder="Örn. 850" className={INPUT}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <input value={priceMin} onChange={e => setPriceMin(e.target.value)} inputMode="decimal" placeholder="Alt sınır" className={INPUT} />
              <input value={priceMax} onChange={e => setPriceMax(e.target.value)} inputMode="decimal" placeholder="Üst sınır" className={INPUT} />
            </div>
          )}
          {(fieldErrors.price || fieldErrors.price_min || fieldErrors.price_max) && (
            <FieldError text={fieldErrors.price || fieldErrors.price_min || fieldErrors.price_max} />
          )}
          <p className="mt-1.5 text-xs text-gray-400">
            &ldquo;Fiyat sorunuz&rdquo; seçeneği bilinçli olarak yok — net fiyat veya güvenilir bir aralık alıcının güvenini kazanır ve ilanının öne çıkmasını sağlar.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Adet" hint="Varsayılan 1" error={fieldErrors.quantity}>
            <input
              value={quantity} onChange={e => setQuantity(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric" className={INPUT}
            />
          </Field>
          <Field label="Kargo">
            <select value={shippingPayer} onChange={e => setShippingPayer(e.target.value as ShippingPayer)} className={INPUT}>
              {SHIPPING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Açıklama" hint="Durum, hasar, uyumluluk gibi detaylar (opsiyonel)" error={fieldErrors.description}>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)}
            rows={4} maxLength={5000} className={`${INPUT} resize-none`}
            placeholder="Parçanın durumu, sökülme nedeni, garanti bilgisi vb."
          />
        </Field>

        {/* ── Fotoğraflar ── */}
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-gray-800">Fotoğraflar</span>
          <p className="mb-3 text-xs text-gray-400">En fazla {MAX_IMAGES} fotoğraf · her biri en fazla {MAX_IMAGE_MB} MB · JPG, PNG veya WEBP</p>

          {images.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((img, idx) => (
                <div key={img.id} className="group relative overflow-hidden rounded-lg border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={`Fotoğraf ${idx + 1}`} className="aspect-square w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">Kapak</span>
                  )}
                  <button
                    type="button" onClick={() => removeImage(img.id)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-500"
                    aria-label="Fotoğrafı sil"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button" onClick={() => moveImage(img.id, -1)} disabled={idx === 0}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white disabled:opacity-30"
                      aria-label="Sola taşı"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button" onClick={() => moveImage(img.id, 1)} disabled={idx === images.length - 1}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white disabled:opacity-30"
                      aria-label="Sağa taşı"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {images.length < MAX_IMAGES && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 px-4 py-4 transition-colors hover:border-primary-400 hover:bg-primary-50/40">
              <Upload className="h-5 w-5 flex-shrink-0 text-gray-400" />
              <span className="text-sm text-gray-600">Fotoğraf ekle</span>
              <input
                ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                onChange={e => { onFiles(e.target.files); if (fileInputRef.current) fileInputRef.current.value = '' }}
              />
            </label>
          )}
          {imagesError && <FieldError text={imagesError} />}
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
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Tag className="h-5 w-5" />}
          {submitting ? 'Gönderiliyor…' : 'İlanı Yayınla'}
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
