import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig, getWhatsAppUrl } from '@/lib/config'

// URL slug → kategori ID ve görünen isim eşlemesi
const KATEGORI_MAP: Record<string, { id: string; ad: string }> = {
  motor:          { id: 'engine',       ad: 'Motor' },
  sogutma:        { id: 'engine',       ad: 'Motor & Soğutma' },
  turbo:          { id: 'turbo_intake', ad: 'Turbo & Emme' },
  yakit:          { id: 'fuel',         ad: 'Yakıt Sistemi' },
  egzoz:          { id: 'exhaust',      ad: 'Egzoz' },
  sanziman:       { id: 'transmission', ad: 'Şanzıman' },
  fren:           { id: 'brake',        ad: 'Fren' },
  suspansiyon:    { id: 'suspension',   ad: 'Süspansiyon' },
  direksiyon:     { id: 'suspension',   ad: 'Süspansiyon & Direksiyon' },
  jant:           { id: 'wheel_tyre',   ad: 'Jant & Lastik' },
  kaporta:        { id: 'body_exterior',ad: 'Kaporta & Dış' },
  cam:            { id: 'glass_mirror', ad: 'Cam & Ayna' },
  aydinlatma:     { id: 'lighting',     ad: 'Aydınlatma' },
  elektrik:       { id: 'electrical',   ad: 'Elektrik' },
  klima:          { id: 'climate',      ad: 'Klima & Isıtma' },
  'ic-aksam':     { id: 'interior',     ad: 'İç Aksam' },
}

function slugToLabel(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toLocaleUpperCase('tr-TR'))
}

export function generateStaticParams() {
  return [
    { kategori: 'kaporta',     parca: 'arka-tampon' },
    { kategori: 'kaporta',     parca: 'on-tampon' },
    { kategori: 'kaporta',     parca: 'kaput' },
    { kategori: 'kaporta',     parca: 'camurluk' },
    { kategori: 'suspansiyon', parca: 'on-amortisor' },
    { kategori: 'suspansiyon', parca: 'arka-amortisor' },
    { kategori: 'suspansiyon', parca: 'rotil' },
    { kategori: 'sogutma',     parca: 'fan-motoru' },
    { kategori: 'sogutma',     parca: 'radyator' },
    { kategori: 'sogutma',     parca: 'su-pompasi' },
    { kategori: 'direksiyon',  parca: 'direksiyon-pompasi' },
    { kategori: 'fren',        parca: 'fren-diski' },
    { kategori: 'fren',        parca: 'fren-balatasi' },
    { kategori: 'motor',       parca: 'alternator' },
    { kategori: 'motor',       parca: 'mars-motoru' },
    { kategori: 'elektrik',    parca: 'far' },
    { kategori: 'elektrik',    parca: 'stop-lambasi' },
  ]
}

export const dynamicParams = true

interface Props {
  params: { kategori: string; parca: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const kategoriInfo = KATEGORI_MAP[params.kategori]
  const parcaAdi = slugToLabel(params.parca)
  const kategoriAdi = kategoriInfo?.ad ?? slugToLabel(params.kategori)

  const title = `${parcaAdi} — ${kategoriAdi} Yedek Parça & Çıkma Parça`
  const description = `${parcaAdi} için uygun fiyatlı yedek parça ve çıkma parça. OEM numarasıyla araç uyumluluğunu kontrol edin, WhatsApp üzerinden hızlıca fiyat alın.`
  const canonical = `https://parcabizden.com.tr/parcalar/${params.kategori}/${params.parca}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      locale: 'tr_TR',
      siteName: 'ParcaBizden',
    },
  }
}

async function fetchParts(kategoriId: string, searchTerm: string) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.parcabizden.com.tr'
    const body = new URLSearchParams({
      action: 'product_list',
      category: kategoriId,
      search: searchTerm,
      per_page: '20',
      page: '1',
    })
    const res = await fetch(`${apiBase}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.products ?? []
  } catch {
    return []
  }
}

export default async function KategoriParcaPage({ params }: Props) {
  const kategoriInfo = KATEGORI_MAP[params.kategori]
  const parcaAdi = slugToLabel(params.parca)
  const kategoriAdi = kategoriInfo?.ad ?? slugToLabel(params.kategori)
  const searchTerm = params.parca.replace(/-/g, ' ')

  const products = kategoriInfo
    ? await fetchParts(kategoriInfo.id, searchTerm)
    : []

  const whatsappMsg = `Merhaba, ${parcaAdi} (${kategoriAdi}) için yedek/çıkma parça fiyatı almak istiyorum.`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: 'https://parcabizden.com.tr' },
      { '@type': 'ListItem', position: 2, name: 'Parçalar',  item: 'https://parcabizden.com.tr/parcalar' },
      { '@type': 'ListItem', position: 3, name: kategoriAdi, item: `https://parcabizden.com.tr/parcalar/${params.kategori}` },
      { '@type': 'ListItem', position: 4, name: parcaAdi,    item: `https://parcabizden.com.tr/parcalar/${params.kategori}/${params.parca}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
            <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <Link href="/parcalar" className="hover:text-gray-900 transition-colors">Parçalar</Link>
            <span>/</span>
            <Link href={`/parcalar?q=${encodeURIComponent(searchTerm)}`} className="hover:text-gray-900 transition-colors">{kategoriAdi}</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{parcaAdi}</span>
          </nav>

          {/* Başlık */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
              {parcaAdi} — <span className="text-primary-500">Yedek & Çıkma Parça</span>
            </h1>
            <p className="text-gray-500 text-base md:text-lg">
              {parcaAdi} için uygun fiyatlı orijinal, muadil ve çıkma parça seçenekleri.
              Şase numaranızla araç uyumluluğunu kontrol edebilir, hemen fiyat sorabilirsiniz.
            </p>
          </div>

          {/* CTA Butonları */}
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <a
              href={getWhatsAppUrl(whatsappMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
            >
              WhatsApp ile Fiyat Sor
            </a>
            <Link
              href={`/parcalar?q=${encodeURIComponent(searchTerm)}`}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-dark-900 font-semibold rounded-xl transition-colors"
            >
              Katalogda Ara
            </Link>
          </div>

          {/* Ürün Listesi */}
          {products.length > 0 ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {parcaAdi} — Stokta Olan Parçalar ({products.length})
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p: { id: string | number; oem_number?: string; name: string; brand_name?: string; price?: number; in_stock?: boolean }) => (
                  <Link
                    key={p.id}
                    href={p.oem_number ? `/parca/${encodeURIComponent(p.oem_number)}` : `/parcalar?q=${encodeURIComponent(p.name)}`}
                    className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all"
                  >
                    <p className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{p.name}</p>
                    {p.oem_number && <p className="text-xs font-mono text-gray-400 mb-1">OEM: {p.oem_number}</p>}
                    {p.brand_name && <p className="text-xs text-gray-500 mb-2">{p.brand_name}</p>}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.in_stock !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.in_stock !== false ? 'Stokta Var' : 'Stokta Yok'}
                      </span>
                      {p.price && p.price > 0 && (
                        <span className="text-sm font-bold text-gray-900">
                          {p.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-gray-600 mb-2 font-medium">
                {parcaAdi} için şu an stokta ürün bulunmuyor.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                WhatsApp üzerinden sorarsanız en uygun fiyatı hemen öğrenebilirsiniz.
              </p>
              <a
                href={getWhatsAppUrl(whatsappMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
              >
                WhatsApp ile Sor — {siteConfig.phone.display}
              </a>
            </div>
          )}

          {/* SSS — schema için */}
          <div className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{parcaAdi} Hakkında Sık Sorulan Sorular</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{parcaAdi} fiyatı ne kadar?</h3>
                <p className="text-gray-500 text-sm">
                  {parcaAdi} fiyatı; aracın markası, modeli ve parçanın orijinal/muadil/çıkma olmasına göre değişir.
                  Güncel fiyat için WhatsApp hattımızdan bilgi alabilirsiniz.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Çıkma {parcaAdi} bulabilir miyim?</h3>
                <p className="text-gray-500 text-sm">
                  Evet, geniş stok ağımız sayesinde çıkma {parcaAdi.toLocaleLowerCase('tr-TR')} temin edebiliyoruz.
                  Araç bilginizi paylaşmanız yeterli.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{parcaAdi} hangi araçlara uyar?</h3>
                <p className="text-gray-500 text-sm">
                  Şase numaranızı bizimle paylaşarak aracınıza uygun {parcaAdi.toLocaleLowerCase('tr-TR')} parçasını
                  anında sorgulayabilirsiniz.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
