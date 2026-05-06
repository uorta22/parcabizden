'use client'

/**
 * Parça Detay (TecDoc tabanlı) — autodoc tarzı.
 *
 * URL: /parca/[oem] (örn. /parca/8E0407151)
 *
 * Akış:
 *  1. URL'deki OEM ile tecdoc_search → ilk eşleşen part_id'yi bul
 *  2. tecdoc_part_detail(part_id) → full detay
 *  3. Layout: image gallery (sol) + supplier/OEM/CTA (sağ) + tabs (alt)
 */

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Copy, MessageCircle, Package, Phone } from 'lucide-react'
import { searchTecParts, getTecPartDetail, type TecPartDetail } from '@/lib/tecdoc'
import { getWhatsAppUrl, siteConfig } from '@/lib/config'

export default function PartDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <PartDetailInner />
    </Suspense>
  )
}

function PartDetailInner() {
  const params = useParams()
  const oem = decodeURIComponent(String(params.oem ?? ''))

  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [detail, setDetail]   = useState<TecPartDetail | null>(null)
  const [activeImg, setActiveImg] = useState(0)
  const [tab, setTab] = useState<'vehicles' | 'cross' | 'images'>('vehicles')

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null); setActiveImg(0)
    ;(async () => {
      try {
        const matches = await searchTecParts(oem)
        if (cancelled) return
        if (matches.length === 0) {
          setError('not_found'); setLoading(false); return
        }
        const exact = matches.find(m => m.part_number.toLowerCase() === oem.toLowerCase())
        const target = exact ?? matches[0]
        const d = await getTecPartDetail(target.id)
        if (!cancelled) setDetail(d)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Bilinmeyen hata')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [oem])

  if (loading) return <DetailSkeleton />

  if (error === 'not_found' || !detail) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <Package className="mx-auto h-14 w-14 text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Parça bulunamadı</h1>
        <p className="mt-2 text-sm text-gray-500">
          <span className="font-mono text-gray-700">{oem}</span> numaralı parça TecDoc kataloğunda yok.
        </p>
        <p className="mt-1 text-sm text-gray-500">WhatsApp&apos;tan sorabilirsiniz, biz arayalım.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/parcalar" className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            ← Tüm Parçalar
          </Link>
          <a
            href={getWhatsAppUrl(`Merhaba, ${oem} numaralı parçayı arıyorum.`)}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-600"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp ile Sor
          </a>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">Hata: {error}</div>
      </main>
    )
  }

  return (
    <PartDetailView
      detail={detail} oem={oem}
      activeImg={activeImg} setActiveImg={setActiveImg}
      tab={tab} setTab={setTab}
    />
  )
}

// ─────────────────────────────────────────────────────────
// View
// ─────────────────────────────────────────────────────────
function PartDetailView({
  detail, oem, activeImg, setActiveImg, tab, setTab,
}: {
  detail: TecPartDetail; oem: string
  activeImg: number; setActiveImg: (n: number) => void
  tab: 'vehicles' | 'cross' | 'images'; setTab: (t: 'vehicles' | 'cross' | 'images') => void
}) {
  const images = detail.images.filter(i => !!i.url)
  const cover = images[activeImg]?.url ?? null

  const message = `Merhaba, ${detail.supplier_name ?? ''} marka ${detail.part_number} numaralı parçayı arıyorum.`

  const compatLabel = useMemo(() => {
    if (detail.compatible_vehicles.length === 0) return null
    const first = detail.compatible_vehicles[0]
    const more = detail.compatible_vehicles.length - 1
    return more > 0
      ? `${first.manufacturer_name} ${first.model_name} ve ${more} araç daha uyumlu`
      : `${first.manufacturer_name} ${first.model_name} uyumlu`
  }, [detail])

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Sticky breadcrumb */}
      <div className="sticky top-16 z-30 border-b border-gray-200 bg-white">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3 max-w-7xl">
          <Link href="/parcalar" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600">
            <ArrowLeft className="h-4 w-4" /> Geri
          </Link>
          <span className="text-gray-300">|</span>
          <span className="truncate text-sm text-gray-500">
            {detail.supplier_name ?? 'Tedarikçi'} · <span className="font-mono">{detail.part_number}</span>
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* SOL: Image gallery */}
          <section className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {cover ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={cover}
                  alt={`${detail.supplier_name ?? ''} ${detail.part_number}`}
                  className="h-full w-full object-contain p-6"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-300">
                  <Package className="h-16 w-16" />
                  <span className="text-xs">Görsel yok</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-6 gap-2">
                {images.slice(0, 12).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`aspect-square overflow-hidden rounded-lg border transition-all ${
                      i === activeImg ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url!} alt={`${i + 1}`} className="h-full w-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* SAĞ: Info + CTA */}
          <section>
            {detail.supplier_name && (
              <div className="mb-2 inline-block rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-gray-700">
                {detail.supplier_name}
              </div>
            )}

            <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
              <span className="font-mono">{detail.part_number}</span>
            </h1>

            {compatLabel && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <Check className="h-4 w-4" /> {compatLabel}
              </p>
            )}

            <dl className="mt-6 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              <Row label="OEM Numarası" value={
                <div className="flex items-center gap-2">
                  <span className="font-mono">{detail.part_number}</span>
                  <CopyButton value={detail.part_number} />
                </div>
              } />
              {detail.supplier_name && <Row label="Tedarikçi Markası" value={detail.supplier_name} />}
              <Row label="Uyumlu Araç Sayısı" value={`${detail.compatible_vehicles.length}+`} />
              <Row label="Çapraz Referans Sayısı" value={`${detail.cross_references.length}`} />
              <Row label="Görsel" value={`${images.length}`} />
            </dl>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href={getWhatsAppUrl(message)}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#22c55e] py-4 text-base font-bold text-white transition-all hover:bg-[#16a34a] hover:shadow-lg"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp ile Fiyat Sor
              </a>
              <a
                href={`tel:${siteConfig.phone.raw}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                <Phone className="h-4 w-4" />
                {siteConfig.phone.display}
              </a>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              Ortalama yanıt süresi: 2 dakika · 7/24 destek
            </p>
          </section>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="flex gap-1 border-b border-gray-200">
            {([
              ['vehicles', `Uyumlu Araçlar (${detail.compatible_vehicles.length})`] as const,
              ['cross',    `Çapraz Referans (${detail.cross_references.length})`] as const,
              ['images',   `Görseller (${detail.images.length})`] as const,
            ]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative px-5 py-3 text-sm font-semibold transition-colors ${
                  tab === key ? 'text-gray-900' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {label}
                {tab === key && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary-500" />}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {tab === 'vehicles' && <VehiclesTab detail={detail} />}
            {tab === 'cross'    && <CrossRefTab detail={detail} />}
            {tab === 'images'   && <ImagesTab detail={detail} />}
          </div>
        </div>
      </div>
    </main>
  )
}

// ─────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────
function VehiclesTab({ detail }: { detail: TecPartDetail }) {
  if (detail.compatible_vehicles.length === 0) {
    return <EmptyTab text="Bu parça için uyumlu araç bilgisi yok." />
  }
  const grouped: Record<string, TecPartDetail['compatible_vehicles']> = {}
  for (const v of detail.compatible_vehicles) {
    const key = `${v.manufacturer_name}|${v.model_name}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(v)
  }
  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([key, vs]) => {
        const [manufacturer, model] = key.split('|')
        return (
          <div key={key} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="font-bold text-gray-900">{manufacturer} {model}</div>
            <ul className="mt-2 grid gap-1.5 text-xs text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
              {vs.map(v => (
                <li key={v.id} className="flex items-baseline gap-2">
                  <Check className="h-3 w-3 flex-shrink-0 text-emerald-600" />
                  <span className="truncate">{v.description ?? `KType ${v.id}`}</span>
                  {v.year_from && (
                    <span className="ml-auto flex-shrink-0 font-mono text-gray-400">
                      {v.year_from}{v.year_to ? `–${v.year_to}` : '+'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function CrossRefTab({ detail }: { detail: TecPartDetail }) {
  if (detail.cross_references.length === 0) {
    return <EmptyTab text="Bu parça için çapraz referans bulunamadı." />
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
          <tr>
            <th className="px-4 py-3">Tedarikçi</th>
            <th className="px-4 py-3">Numara</th>
            <th className="px-4 py-3">Tip</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {detail.cross_references.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-semibold text-gray-900">{r.ref_supplier_name ?? `Tedarikçi #${r.ref_supplier_id}`}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.ref_part_number}</td>
              <td className="px-4 py-3 text-xs text-gray-500">{r.ref_type}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/parca/${encodeURIComponent(r.ref_part_number)}`}
                  className="text-xs font-semibold text-primary-600 hover:underline"
                >
                  Görüntüle →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ImagesTab({ detail }: { detail: TecPartDetail }) {
  const withUrl = detail.images.filter(i => i.url)
  if (withUrl.length === 0) return <EmptyTab text="Bu parça için görsel yüklenmemiş." />
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {withUrl.map((img, i) => (
        <li key={i} className="aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url!} alt={img.name ?? ''} className="h-full w-full object-contain p-2" />
        </li>
      ))}
    </ul>
  )
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
      aria-label="Kopyala"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function EmptyTab({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
      {text}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-7xl animate-pulse">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="aspect-square rounded-2xl bg-gray-100" />
        <div className="space-y-4">
          <div className="h-4 w-32 rounded bg-gray-100" />
          <div className="h-8 w-2/3 rounded bg-gray-100" />
          <div className="h-32 rounded-xl bg-gray-100" />
          <div className="h-12 rounded-xl bg-gray-100" />
        </div>
      </div>
    </main>
  )
}
