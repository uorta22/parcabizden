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
import {
  ArrowLeft, Check, Copy, MessageCircle, Package, Phone,
  Star, ShoppingCart, Truck, ShieldCheck, Share2,
  Plus, Minus, ChevronDown, ChevronRight,
} from 'lucide-react'
import { searchTecParts, getTecPartDetail, type TecPartDetail } from '@/lib/tecdoc'
import { getWhatsAppUrl, siteConfig } from '@/lib/config'
import { useToast } from '@/contexts/ToastContext'

type TabKey = 'specs' | 'reviews' | 'vehicles' | 'faq' | 'cross' | 'installments'

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
  const [tab, setTab] = useState<TabKey>('specs')

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
  tab: TabKey; setTab: (t: TabKey) => void
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

  // Bu sayfa TecDoc katalog kaydı — envanter değil, fiyatı da yok.
  // Pazaryerine iki çıkış var: bu OEM için yayındaki ilanlar, ya da talep açmak.
  const [qty, setQty] = useState(1)
  const productTitle = `${detail.supplier_name ?? 'Parça'} ${detail.part_number}`
  const askMessage = `Merhaba, ${productTitle} ürününden ${qty} adet arıyorum. Fiyat ve stok bilgisi alabilir miyim?`
  const listingsHref = `/ilanlar?q=${encodeURIComponent(detail.part_number)}`

  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary-600">Anasayfa</Link>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <Link href="/parcalar" className="hover:text-primary-600">Yedek Parçalar</Link>
            <ChevronRight className="h-3 w-3 text-gray-300" />
            <span className="text-gray-700 font-medium truncate">{productTitle}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* SOL: Image gallery */}
          <section className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {cover ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={cover}
                  alt={productTitle}
                  className="h-full w-full object-contain p-8"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-300">
                  <Package className="h-16 w-16" />
                  <span className="text-xs">Görsel yok</span>
                </div>
              )}
              {/* Sol alt: %100 Uyumlu rozet */}
              {compatLabel && (
                <div className="absolute inset-x-3 bottom-3 flex flex-col gap-2 sm:flex-row">
                  <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-md">
                    <Check className="h-3.5 w-3.5" /> %100 Uyumlu
                  </span>
                  <a
                    href={getWhatsAppUrl(`Merhaba, ${detail.part_number} numaralı parçanın aracıma uygunluğunu kontrol edebilir misiniz?`)}
                    target="_blank" rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500 bg-white px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-50"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Whatsapp ile Kontrol Et
                  </a>
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
            {/* Yıldız + yorum sayısı (placeholder) */}
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-gray-200 text-gray-200" />
                ))}
              </div>
              <span>0 Yorum</span>
            </div>

            {/* Ürün başlığı */}
            <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
              {productTitle}
            </h1>

            {/* Fiyat (talep üzerine — TecDoc'ta yok) */}
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-base text-gray-400 line-through">Fiyat talep üzerine</span>
              <span className="text-2xl font-black text-gray-900">WhatsApp&apos;tan sor</span>

              {/* Qty stepper */}
              <div className="ml-auto inline-flex items-center overflow-hidden rounded-lg border border-gray-300">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50" aria-label="Azalt">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50" aria-label="Arttır">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Yarın Kargoda / Garantili Ürün rozetleri */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <Truck className="h-3.5 w-3.5" /> Yarın Kargoda
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" /> Garantili Ürün
              </span>
            </div>

            {/* Katalogdan pazaryerine iki çıkış: yayındaki ilanlar, ya da talep aç. */}
            <div className="mt-4 flex gap-2">
              <Link
                href={listingsHref}
                className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#22c55e] py-4 text-base font-black uppercase tracking-wider text-white transition-all hover:bg-[#16a34a] hover:shadow-lg"
              >
                <ShoppingCart className="h-5 w-5" />
                Bu Parçanın İlanları
              </Link>
              {/* Doğrudan sormak isteyenler için */}
              <a
                href={getWhatsAppUrl(askMessage)}
                target="_blank" rel="noopener noreferrer"
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-500 text-white transition-colors hover:bg-primary-400"
                aria-label="WhatsApp ile sor"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <button
                onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.href : ''
                  if (navigator.share) navigator.share({ title: productTitle, url }).catch(() => {})
                  else { navigator.clipboard.writeText(url); alert('Bağlantı kopyalandı') }
                }}
                className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary-500 text-primary-600 transition-colors hover:bg-primary-50"
                aria-label="Paylaş"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {/* Ürün Özellikleri tablosu */}
            <section className="mt-6 rounded-xl border border-gray-200 bg-white">
              <header className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-bold text-gray-900">Ürün Özellikleri</h2>
              </header>
              <dl className="divide-y divide-gray-100">
                {detail.supplier_name && (
                  <SpecRow label="Marka" value={detail.supplier_name} highlight />
                )}
                <SpecRow label="Stok Kodu" value={
                  <span className="inline-flex items-center gap-2">
                    <span className="font-mono">{detail.part_number}</span>
                    <CopyButton value={detail.part_number} />
                  </span>
                } highlight />
                <SpecRow label="Birim" value="1 Adet" />
                <SpecRow label="Ürün Grubu" value={
                  <Link href="/parcalar" className="text-primary-600 hover:underline">
                    Yedek Parça
                  </Link>
                } />
                <SpecRow label="Uyumlu Araç Sayısı" value={`${detail.compatible_vehicles.length}+`} />
                <SpecRow label="Çapraz Referans" value={`${detail.cross_references.length} muadil`} />
              </dl>
            </section>

            {/* Marka detayı */}
            {detail.supplier_name && (
              <details className="mt-3 rounded-xl border border-gray-200 bg-white group">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-bold text-gray-700">
                  <span className="inline-flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{detail.supplier_name}</span>
                    <span>Marka Detayı</span>
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-600 leading-relaxed">
                  <strong>{detail.supplier_name}</strong> markası TecDoc kataloğunda kayıtlı orijinal ekipman tedarikçisidir.
                  Bu marka altında {detail.cross_references.length}&nbsp;çapraz referanslı ürün ve {detail.compatible_vehicles.length}+
                  uyumlu araç bulunmaktadır.
                </div>
              </details>
            )}
          </section>
        </div>

        {/* Tabs — 6 sekme (görsel 2 altı) */}
        <div className="mt-10">
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex min-w-max gap-1">
              {([
                ['specs',         'Ürün Özellikleri'] as const,
                ['reviews',       'Yorumlar'] as const,
                ['vehicles',      `Uyumlu Araçlar (${detail.compatible_vehicles.length})`] as const,
                ['faq',           'Sıkça Sorulan Sorular'] as const,
                ['cross',         `Alternatif Markalar (${detail.cross_references.length})`] as const,
                ['installments',  'Taksit Seçenekleri'] as const,
              ]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`relative whitespace-nowrap px-5 py-3 text-sm font-semibold transition-colors ${
                    tab === key ? 'text-primary-600' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {label}
                  {tab === key && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary-500" />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 pb-12">
            {tab === 'specs'        && <SpecsTab detail={detail} />}
            {tab === 'reviews'      && <ReviewsTab />}
            {tab === 'vehicles'     && <VehiclesTab detail={detail} />}
            {tab === 'faq'          && <FaqTab />}
            {tab === 'cross'        && <CrossRefTab detail={detail} />}
            {tab === 'installments' && <InstallmentsTab />}
          </div>
        </div>
      </div>
    </main>
  )
}

// ─────────────────────────────────────────────────────────
// Yeni: SpecRow (Ürün Özellikleri tablosu satırı)
// ─────────────────────────────────────────────────────────
function SpecRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <dt className="text-xs text-gray-500">{label}:</dt>
      <dd className={`text-sm text-right ${highlight ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{value}</dd>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Yeni Tab'lar
// ─────────────────────────────────────────────────────────
function SpecsTab({ detail }: { detail: TecPartDetail }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-base font-bold text-gray-900">Teknik Özellikler</h3>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        <SpecRow label="OEM / Stok Kodu" value={<span className="font-mono">{detail.part_number}</span>} />
        {detail.supplier_name && <SpecRow label="Tedarikçi Markası" value={detail.supplier_name} />}
        {detail.supplier_matchcode && <SpecRow label="Marka Kodu" value={detail.supplier_matchcode} />}
        <SpecRow label="Uyumlu Araç Sayısı" value={`${detail.compatible_vehicles.length}+`} />
        <SpecRow label="Çapraz Referans Sayısı" value={`${detail.cross_references.length}`} />
        <SpecRow label="Görsel Sayısı" value={`${detail.images.length}`} />
      </dl>
    </div>
  )
}

function ReviewsTab() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
      <Star className="mx-auto mb-3 h-10 w-10 text-gray-300" />
      <p className="font-semibold text-gray-700">Henüz yorum yok</p>
      <p className="mt-1 text-xs text-gray-500">Bu ürünü satın alanlar yorum yapabilir.</p>
    </div>
  )
}

function FaqTab() {
  const faqs = [
    { q: 'Bu parça aracıma kesin uyar mı?', a: 'TecDoc kataloğu üzerinden aracınıza birebir uyumluluğu doğrulanmıştır. Yine de emin değilseniz şase numaranızla "WhatsApp ile Kontrol Et" butonundan teyit alabilirsiniz.' },
    { q: 'Stokta var mı?',                  a: 'Stok bilgisi WhatsApp üzerinden anlık paylaşılır. Sepete ekle ile fiyat ve stok talebini iletebilirsiniz; ortalama yanıt süresi 2 dakikadır.' },
    { q: 'Garanti süresi nedir?',            a: 'Tedarikçi firma garantisi geçerlidir. Markaya göre 1 ila 3 yıl arasında değişir.' },
    { q: 'Kargo ne kadar sürer?',            a: 'Stokta olan ürünler ertesi iş günü kargoya verilir. Türkiye geneli 1-3 iş günü teslim.' },
    { q: 'İade ve değişim yapabilir miyim?', a: 'Yanlış parça gönderimi veya üretim hatalarında 14 gün içinde ücretsiz iade/değişim hakkınız vardır.' },
  ]
  return (
    <div className="space-y-2">
      {faqs.map((f, i) => (
        <details key={i} className="group rounded-xl border border-gray-200 bg-white">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800">
            {f.q}
            <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-600 leading-relaxed">{f.a}</div>
        </details>
      ))}
    </div>
  )
}

function InstallmentsTab() {
  const banks = [
    { name: 'Tek Çekim',     rate: 0,    months: [{ m: 1, factor: 1.00 }] },
    { name: 'Bonus',         rate: 0,    months: [{ m: 2, factor: 1.00 }, { m: 3, factor: 1.00 }] },
    { name: 'Maximum',       rate: 0,    months: [{ m: 2, factor: 1.00 }, { m: 3, factor: 1.00 }] },
    { name: 'World',         rate: 0,    months: [{ m: 2, factor: 1.00 }, { m: 3, factor: 1.00 }] },
    { name: 'Axess',         rate: 0,    months: [{ m: 2, factor: 1.00 }, { m: 3, factor: 1.00 }] },
  ]
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
          <tr>
            <th className="px-4 py-3">Banka / Kart</th>
            <th className="px-4 py-3">Taksit Seçenekleri</th>
            <th className="px-4 py-3 text-right">Komisyon</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {banks.map(b => (
            <tr key={b.name} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-semibold text-gray-900">{b.name}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {b.months.map(mo => (
                    <span key={mo.m} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {mo.m} taksit
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-right text-xs font-semibold text-emerald-700">%{b.rate} komisyon</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
        7.500&nbsp;₺ ve üzeri alışverişlerde 2 taksite %0 komisyon. Detaylı bilgi için WhatsApp&apos;tan iletişime geçin.
      </p>
    </div>
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
