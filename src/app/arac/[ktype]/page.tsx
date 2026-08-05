'use client'

/**
 * Vehicle Hub — VIN ya da VehicleFinder sonrası araç kartı sayfası.
 *
 * URL: /arac/[ktype]  (ktype = catalog_vehicles.id)
 *
 * Yapı (görsel 1 referansı):
 *   ┌────────────────────────────────────────────────────────┐
 *   │ [GARAJ]  [ARAÇ]  [ŞASİ]  [ARACIM]  ──────  [Paylaş ▾]  │
 *   ├────────────────────────────────────────────────────────┤
 *   │  [silüet]   Skoda Octavia (NX3) Elite                  │
 *   │             • Hybrid (Benzin) - 1,5 L - 110 kW - 150 hp│
 *   │             • Otomatik - 7 Vites • 2024                │
 *   │                                                        │
 *   │  Yedek Parçalar  •  Bakım Robotu  •  Randevu Al        │
 *   └────────────────────────────────────────────────────────┘
 */

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Car, Wrench, CalendarClock, Share2, Pencil, Trash2,
  Hash, Warehouse, ChevronRight,
} from 'lucide-react'
import { getTecVehicles, getTecModels, getTecVehicleAttributes, getTecBrands,
         type TecVehicle, type TecModel, type TecBrand, type TecAttributeGroups } from '@/lib/tecdoc'
import { getWhatsAppUrl } from '@/lib/config'
import { trGroup, trTitle, trValue } from '@/lib/tecdoc-i18n'
import { BrandLogo } from '@/components/BrandLogos'
import VehiclePartsSection from '@/components/VehiclePartsSection'

type Tab = 'garaj' | 'arac' | 'sasi' | 'aracim'

export default function VehicleHubPage() {
  return (
    <Suspense fallback={<HubSkeleton />}>
      <VehicleHubInner />
    </Suspense>
  )
}

function VehicleHubInner() {
  const params = useParams()
  const router = useRouter()
  const sp = useSearchParams()
  const ktype = parseInt(String(params.ktype ?? '0'), 10)

  // Araç seçicinin taşıdığı görüntüleme bilgisi (bkz. VehiclePickerModal).
  const pickedBrand   = sp.get('b') ?? ''
  const pickedModel   = sp.get('m') ?? ''
  const pickedVariant = sp.get('v') ?? ''

  const [tab, setTab] = useState<Tab>('aracim')
  const [vehicle, setVehicle] = useState<TecVehicle | null>(null)
  const [model, setModel]     = useState<TecModel | null>(null)
  const [brand, setBrand]     = useState<TecBrand | null>(null)
  const [attrs, setAttrs]     = useState<TecAttributeGroups | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // ── Veri zinciri: ktype → vehicle, sonra model, sonra brand ──
  useEffect(() => {
    if (!ktype) { setError('Geçersiz araç ID'); setLoading(false); return }
    let cancelled = false
    setLoading(true); setError(null)

    ;(async () => {
      try {
        // attrs paralel
        const [attrsData] = await Promise.all([
          getTecVehicleAttributes(ktype).catch(() => null),
        ])
        if (cancelled) return
        if (attrsData) setAttrs(attrsData)

        // vehicle bilgisini bulmak için: model → vehicles içinde KType ara
        // Bunu doğrudan yapan endpoint yok; akıllı yol: brands → her brand için arama yapmak yerine,
        // attribute'lardan model_id veya benzeri bilgi çekmeyi denemek lazım.
        // Şimdilik attribute'lardan vehicle metadata'sını çıkartıyoruz.
        // (Tam veri zinciri için ileride 'tecdoc_vehicle_full' endpoint'i eklenebilir.)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Yüklenemedi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [ktype])

  // Başlık: önce seçicinin taşıdığı isim, yoksa attribute'lardan türet
  const headline = useMemo(
    () => [pickedBrand, pickedModel, pickedVariant].filter(Boolean).join(' ') || buildHeadline(attrs),
    [pickedBrand, pickedModel, pickedVariant, attrs]
  )
  const specs = useMemo(() => buildSpecs(attrs), [attrs])
  const conflicting = useMemo(() => hasConflictingData(attrs), [attrs])

  if (loading) return <HubSkeleton />

  if (error) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <Car className="mx-auto h-14 w-14 text-gray-300" />
        <h1 className="mt-4 text-xl font-bold text-gray-900">Araç bulunamadı</h1>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-bold text-[#0b1120] hover:bg-primary-400">
          ← Anasayfa
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8">
        {/* Geri linki */}
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" /> Geri
        </button>

        {/* Vehicle Hub Card */}
        <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Üst tabs şeridi */}
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-2 sm:px-4">
            <nav className="flex flex-1 items-center" role="tablist">
              {([
                ['garaj',  'GARAJ',   Warehouse] as const,
                ['arac',   'ARAÇ',    Car] as const,
                ['sasi',   'ŞASİ',    Hash] as const,
                ['aracim', 'ARACIM',  Car] as const,
              ]).map(([key, label, Icon]) => {
                const active = tab === key
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(key as Tab)}
                    className={`relative flex flex-1 items-center justify-center gap-2 px-3 py-3.5 text-xs font-bold tracking-wider transition-colors sm:text-sm ${
                      active
                        ? 'text-primary-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.slice(0, 1)}</span>
                    {active && (
                      <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-t-full bg-primary-500" />
                    )}
                  </button>
                )
              })}
            </nav>
            {/* Sağ aksiyonlar */}
            <div className="flex items-center gap-1.5 px-2">
              <ActionPill icon={<Share2 className="h-3.5 w-3.5" />} color="emerald" onClick={() => share()}>
                Paylaş
              </ActionPill>
              <ActionPill icon={<Pencil className="h-3.5 w-3.5" />} color="blue" onClick={() => alert('Düzenleme yakında')}>
                Düzenle
              </ActionPill>
              <ActionPill icon={<Trash2 className="h-3.5 w-3.5" />} color="gray">
                Kaldır
              </ActionPill>
            </div>
          </header>

          {/* Body — ARACIM/ARAÇ tabs için */}
          {(tab === 'aracim' || tab === 'arac') && (
            <div className="grid gap-6 p-5 md:grid-cols-[260px_1fr] md:p-7">
              {/* Sol: silüet/logo */}
              <div className="relative flex items-center justify-center rounded-xl bg-gray-50 p-6">
                {pickedBrand
                  ? <BrandLogo brand={pickedBrand} size={120} />
                  : <Car className="h-20 w-20 text-gray-300" />}
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className={`h-1.5 w-4 rounded-full ${i === 0 ? 'bg-primary-500' : 'bg-gray-300'}`} />
                  ))}
                </div>
              </div>

              {/* Sağ: bilgi */}
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tight text-gray-900 md:text-2xl">
                  {headline || `KType ${ktype}`}
                </h1>

                {specs.length > 0 && (
                  <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-600">
                    {specs.map((s, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Aksiyon link'leri */}
                <div className="mt-auto flex flex-wrap items-center gap-x-1 gap-y-2 pt-6">
                  <ActionLink
                    href={`/parcalar?vehicle=${ktype}`}
                    icon={<Wrench className="h-4 w-4" />}
                  >
                    Yedek Parçalar
                  </ActionLink>
                  <Dot />
                  <ActionLink
                    href={`/hesabim/garaj`}
                    icon={<Car className="h-4 w-4" />}
                  >
                    Bakım Robotu
                  </ActionLink>
                  <Dot />
                  <ActionLink
                    href={getWhatsAppUrl(`Merhaba, ${headline || 'aracım'} için randevu almak istiyorum.`)}
                    icon={<CalendarClock className="h-4 w-4" />}
                    external
                  >
                    Randevu Al
                  </ActionLink>
                </div>
              </div>
            </div>
          )}

          {/* GARAJ tab */}
          {tab === 'garaj' && (
            <div className="p-7">
              <p className="mb-4 text-sm text-gray-600">
                Bu aracı garajınıza ekleyin — bakım takibi, sipariş geçmişi ve hızlı parça arama için.
              </p>
              <Link
                href="/hesabim/garaj"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-bold text-[#0b1120] hover:bg-primary-400"
              >
                Garajıma Ekle <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* ŞASİ tab */}
          {tab === 'sasi' && (
            <div className="p-7">
              <h2 className="mb-2 text-sm font-bold text-gray-900">Şase ile detaylı bilgi</h2>
              <p className="mb-4 text-sm text-gray-500">
                17 karakterlik VIN numaranızı girerek bu araca özel ek bilgiler (üretim yeri, fabrika seçenekleri vs.) edinebilirsiniz.
              </p>
              <Link
                href="/?tab=vin"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                VIN Sorgula <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </article>

        {/* Teknik özellik tabs altında ek bilgi */}
        {/* Yedek Parçalar — kategori grid (otoparcasan tarzı) */}
        <VehiclePartsSection vehicleId={ktype} />

        {attrs && Object.keys(attrs.groups).length > 0 && (
          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 md:p-7">
            <h2 className="mb-4 text-base font-bold text-gray-900">Teknik Özellikler</h2>

            {conflicting && (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Bu araç için katalogda birden fazla motor verisi kayıtlı ve değerler çelişiyor.
                Aşağıdaki değerler aracınıza ait olmayabilir — parça siparişinden önce
                WhatsApp&apos;tan teyit alın.
              </p>
            )}

            <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              {Object.entries(attrs.groups).map(([group, items]) => (
                <div key={group}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary-600">{trGroup(group)}</h3>
                  <dl className="divide-y divide-gray-100">
                    {items.slice(0, 8).map((it, i) => (
                      <div key={i} className="flex justify-between gap-3 py-1.5 text-xs">
                        <dt className="text-gray-500">{trTitle(it.title)}</dt>
                        <dd className="text-right font-semibold text-gray-800">{trValue(it.value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )

  function share() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.share) {
      navigator.share({ title: headline || 'Aracım', url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      alert('Bağlantı kopyalandı')
    }
  }
}

// ─────────────────────────────────────────────────────────
// Yardımcılar
// ─────────────────────────────────────────────────────────
function buildHeadline(attrs: TecAttributeGroups | null): string {
  if (!attrs) return ''
  const all = Object.values(attrs.groups).flat()
  // Marka/model/varyant gibi alanları yakala
  const find = (keys: string[]) => all.find(a =>
    keys.some(k => (a.title ?? '').toLowerCase().includes(k.toLowerCase()))
  )?.value ?? ''
  const make    = find(['marka', 'make', 'manufacturer'])
  const model   = find(['model'])
  const variant = find(['version', 'variant', 'tipi'])
  const out = [make, model, variant].filter(Boolean).join(' ')
  return out
}

/**
 * Attribute başlığını tam eşleşmeyle okur.
 *
 * Substring eşleşme kullanılmaz: TecDoc aynı önekle birden çok alan döndürüyor
 * ("Capacity", "Capacity (tax)", "Capacity (technic)") ve ilk eşleşmeyi almak
 * yanlış değeri seçiyordu.
 *
 * Katalogda bazı araçlara birden fazla motorun verisi karışmış durumda (aynı
 * başlık, çelişen değerler). Böyle bir durumda hangisinin doğru olduğunu
 * bilemeyiz; yanlış teknik veri göstermektense hiç göstermiyoruz.
 */
type TecAttr = { title: string | null; value: string | null }

/** Verilen başlığa tam eşleşen, boş olmayan farklı değerler. */
function valuesOf(all: TecAttr[], title: string, unit?: RegExp): string[] {
  const want = title.trim().toLowerCase()
  const vals = all
    .filter(a => (a.title ?? '').trim().toLowerCase() === want)
    .map(a => (a.value ?? '').trim())
    .filter(v => v && (!unit || unit.test(v)))
  return vals.filter((v, i) => vals.indexOf(v) === i)
}

/**
 * Başlıkları öncelik sırasıyla dener; tek bir değere indirgenen ilk başlığı döndürür.
 * Birden fazla farklı değer varsa o başlık atlanır — hangisinin doğru olduğunu bilemeyiz.
 */
function pickExact(all: TecAttr[], titles: string[], unit?: RegExp): string | null {
  for (const t of titles) {
    const vals = valuesOf(all, t, unit)
    if (vals.length === 1) return vals[0]
  }
  return null
}

/**
 * Katalogda bazı KType kayıtlarına birden fazla motorun attribute'ları karışmış
 * durumda. Bir motor için tek değerli olması gereken alanlar çelişiyorsa,
 * o araca ait teknik tablonun tamamı şüphelidir.
 *
 * Kalıcı çözüm catalog_vehicle_attributes tablosunu kaynağında temizlemek.
 */
const SINGLE_VALUED_TITLES = ['Fuel type', 'Engine type', 'Number of cylinders', 'Number of valves']

function hasConflictingData(attrs: TecAttributeGroups | null): boolean {
  if (!attrs) return false
  const all = Object.values(attrs.groups).flat()
  return SINGLE_VALUED_TITLES.some(t => valuesOf(all, t).length > 1)
}

function buildSpecs(attrs: TecAttributeGroups | null): string[] {
  if (!attrs) return []
  const all = Object.values(attrs.groups).flat()

  // "Capacity" hem ccm hem l olarak gelir; (technic) tek satır ve her zaman ccm.
  const cc     = pickExact(all, ['Capacity (technic)', 'Capacity', 'Motor hacmi'], /ccm/i)
  // "Power" birimi değerin içinde taşır ("85 kW", "116 PS") — ayrı ayrı okunur.
  const kw     = pickExact(all, ['Power', 'Güç'], /kW/i)
  const ps     = pickExact(all, ['Power', 'Güç'], /\b(PS|HP)\b/i)
  const fuel   = pickExact(all, ['Fuel type', 'Yakıt tipi'])
  const engine = pickExact(all, ['Engine code', 'Motor kodu'])
  const trans  = pickExact(all, ['Transmission type', 'Şanzıman'])

  const power = [kw, ps].filter(Boolean).join(' / ') || null
  const head = [fuel, cc, power].filter(Boolean)

  const out: string[] = []
  if (head.length) out.push(head.join(' - '))
  if (engine) out.push(`Motor kodu: ${engine}`)
  if (trans)  out.push(trans)
  return out
}

function ActionLink({
  href, icon, children, external,
}: { href: string; icon: React.ReactNode; children: React.ReactNode; external?: boolean }) {
  const cls = 'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-bold text-primary-600 transition-colors hover:bg-primary-50'
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{icon}{children}</a>
  return <Link href={href} className={cls}>{icon}{children}</Link>
}

function ActionPill({
  icon, children, color, onClick,
}: { icon: React.ReactNode; children: React.ReactNode; color: 'emerald' | 'blue' | 'gray'; onClick?: () => void }) {
  const colors = {
    emerald: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
    blue:    'border-blue-300    text-blue-700    hover:bg-blue-50',
    gray:    'border-gray-300    text-gray-600    hover:bg-gray-50',
  }
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold transition-colors ${colors[color]}`}
    >
      {icon}{children}
    </button>
  )
}

function Dot() {
  return <span aria-hidden className="text-gray-300">•</span>
}

function HubSkeleton() {
  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 animate-pulse">
      <div className="mb-4 h-4 w-16 rounded bg-gray-200" />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="h-14 border-b border-gray-100 bg-gray-50" />
        <div className="grid gap-6 p-7 md:grid-cols-[260px_1fr]">
          <div className="aspect-[4/3] rounded-xl bg-gray-100" />
          <div className="space-y-3">
            <div className="h-6 w-2/3 rounded bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-100" />
            <div className="h-4 w-1/2 rounded bg-gray-100" />
            <div className="mt-6 h-8 w-2/3 rounded bg-gray-100" />
          </div>
        </div>
      </div>
    </main>
  )
}
