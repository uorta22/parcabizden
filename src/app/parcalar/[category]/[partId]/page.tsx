import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, MessageCircle, Search, ArrowLeft, Car } from 'lucide-react'
import { parts, categories, getPartById, getRelatedParts, getCategoryById, getPartsByCategory } from '@/data/parts'
import { BrandLogo } from '@/components/BrandLogos'
import { notFound } from 'next/navigation'
import { siteConfig, getWhatsAppUrl } from '@/lib/config'

interface PageProps {
  params: { category: string; partId: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const part = getPartById(params.partId)

  if (!part || part.category !== params.category) {
    return { title: 'Parça Bulunamadı | ParcaBizden' }
  }

  const brandText = part.brands.includes('Tüm Markalar')
    ? 'tüm markalara uygun'
    : part.brands.slice(0, 5).join(', ') + ' uyumlu'

  return {
    title: `${part.name} - ${part.categoryName} | ParcaBizden`,
    description: `${part.name}: ${part.description}. ${brandText}. Yedek ve çıkma parça seçenekleri için WhatsApp üzerinden fiyat alın.`,
    keywords: `${part.name.toLowerCase()}, ${part.categoryName.toLowerCase()}, yedek parça, çıkma parça, oto parça`,
    openGraph: {
      title: `${part.name} - ${part.categoryName} | ParcaBizden`,
      description: `${part.name}: ${part.description}. ${brandText}.`,
      url: `${siteConfig.url}/parcalar/${params.category}/${params.partId}`,
      siteName: siteConfig.name,
      type: 'website',
    },
  }
}

export async function generateStaticParams() {
  return parts.map((part) => ({
    category: part.category,
    partId: part.id,
  }))
}

export default function PartDetailPage({ params }: PageProps) {
  const part = getPartById(params.partId)

  if (!part || part.category !== params.category) {
    notFound()
  }

  const category = getCategoryById(params.category)
  const relatedParts = getRelatedParts(params.partId, 6)
  const otherCategories = categories.filter(cat => cat.id !== params.category).slice(0, 6)

  const whatsappMessage = `Merhaba, ${part.name} (${part.categoryName}) parçası hakkında fiyat ve stok bilgisi almak istiyorum.`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: part.name,
    description: part.description,
    category: part.categoryName,
    brand: {
      '@type': 'Organization',
      name: 'ParcaBizden',
    },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'TRY',
      seller: {
        '@type': 'Organization',
        name: 'ParcaBizden',
        url: siteConfig.url,
      },
    },
  }

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 flex-wrap">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/parcalar" className="hover:text-gray-900 transition-colors">Parçalar</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href={`/parcalar/${params.category}`} className="hover:text-gray-900 transition-colors">
            {category?.name || part.categoryName}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{part.name}</span>
        </nav>

        {/* Back link */}
        <Link
          href={`/parcalar/${params.category}`}
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {category?.name || part.categoryName} kategorisine dön
        </Link>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Left: Part details (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title section */}
            <div>
              <span className="inline-block px-3 py-1 bg-primary-500/10 text-primary-600 rounded-full text-xs font-medium mb-3">
                {part.categoryName}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {part.name}
              </h1>
              <p className="text-gray-500 text-lg">
                {part.description}
              </p>
            </div>

            {/* Compatible brands */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Uyumlu Markalar</h2>
              <div className="flex flex-wrap gap-2">
                {part.brands.map((brand, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm"
                  >
                    {brand !== 'Tüm Markalar' && <BrandLogo brand={brand} size={18} />}
                    {brand}
                  </span>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-gray-900 font-semibold text-lg mb-1">Fiyat ve Stok Bilgisi Alın</h3>
                  <p className="text-gray-500 text-sm">
                    WhatsApp üzerinden hızlıca fiyat teklifi ve stok bilgisi alabilirsiniz.
                  </p>
                </div>
                <a
                  href={getWhatsAppUrl(whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp ile Fiyat Al
                </a>
              </div>
            </div>
          </div>

          {/* Right sidebar (1 col) */}
          <div className="space-y-6">
            {/* Price info card */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
              <h3 className="text-gray-900 font-semibold mb-2">Fiyat Bilgisi</h3>
              <p className="text-gray-500 text-sm mb-4">
                Sitemizde fiyat bilgisi gösterilmemektedir. Güncel fiyat ve stok durumu aracınızın marka, model ve yılına göre değişiklik gösterebilir.
              </p>
              <a
                href={getWhatsAppUrl(whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600/10 hover:bg-green-600 text-green-600 hover:text-white rounded-lg transition-all font-medium text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp ile Talep Et
              </a>
            </div>

            {/* Brand picker CTA card */}
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center mb-3">
                <Car className="w-5 h-5 text-primary-500" />
              </div>
              <h3 className="text-gray-900 font-semibold mb-2">Aracınıza Özel Parça Bulun</h3>
              <p className="text-gray-500 text-sm mb-4">
                Marka ve model seçerek aracınıza uygun parça kataloğuna ulaşın.
              </p>
              <Link
                href="/parcalar"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary-500 hover:bg-primary-600 text-dark-900 rounded-lg transition-all font-medium text-sm"
              >
                <Car className="w-4 h-4" />
                Marka Seçerek Ara
              </Link>
            </div>

            {/* Chassis search card */}
            <div className="bg-primary-500/5 border border-primary-500/20 rounded-xl p-6">
              <h3 className="text-gray-900 font-semibold mb-2">Aracınıza Uygun mu?</h3>
              <p className="text-gray-500 text-sm mb-4">
                Şase numaranız ile aracınıza uygun parçaları sorgulayabilirsiniz.
              </p>
              <Link
                href="/sase-sorgula"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary-500 hover:bg-primary-600 text-dark-900 rounded-lg transition-all font-medium text-sm"
              >
                <Search className="w-4 h-4" />
                Şase ile Sorgula
              </Link>
            </div>
          </div>
        </div>

        {/* Related parts */}
        {relatedParts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Aynı Kategoriden Diğer Parçalar
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {relatedParts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/parcalar/${rp.category}/${rp.id}`}
                  className="group bg-white border border-gray-200 shadow-sm rounded-xl p-5 hover:border-primary-300 transition-all"
                >
                  <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs mb-2">
                    {rp.categoryName}
                  </span>
                  <h3 className="text-gray-900 font-semibold mb-1 group-hover:text-primary-500 transition-colors">
                    {rp.name}
                  </h3>
                  <p className="text-gray-500 text-sm">{rp.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Other categories */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Diğer Kategoriler</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {otherCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/parcalar/${cat.id}`}
                className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 text-center hover:border-primary-400 transition-all group"
              >
                <p className="text-gray-900 font-medium text-sm group-hover:text-primary-500 transition-colors">
                  {cat.name}
                </p>
                <p className="text-gray-400 text-xs mt-1">{cat.partCount}+ Parça</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
