import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, MessageCircle, Search, Car } from 'lucide-react'
import { categories, getPartsByCategory, getCategoryById } from '@/data/parts'
import { BrandLogo } from '@/components/BrandLogos'
import { notFound } from 'next/navigation'
import { siteConfig, getWhatsAppUrl } from '@/lib/config'

interface PageProps {
  params: { category: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = getCategoryById(params.category)

  if (!category) {
    return {
      title: 'Kategori Bulunamadı | ParcaBizden'
    }
  }

  return {
    title: `${category.name} - Yedek Parça & Çıkma Parça | ParcaBizden`,
    description: `${category.name}: ${category.description}. Tüm marka ve modellere uygun yedek parça ve çıkma parça seçenekleri. En uygun fiyatlarla hızlı teslimat.`,
    keywords: `${category.name.toLowerCase()}, yedek parça, çıkma parça, oto parça, ${category.name.toLowerCase()} fiyat, ${category.name.toLowerCase()} yedek`,
    alternates: {
      canonical: `/parcalar/${params.category}`,
    },
  }
}

export async function generateStaticParams() {
  return categories.map((category) => ({
    category: category.id,
  }))
}

export default function CategoryPage({ params }: PageProps) {
  const category = getCategoryById(params.category)

  if (!category) {
    notFound()
  }

  const categoryParts = getPartsByCategory(params.category)

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/parcalar" className="hover:text-gray-900 transition-colors">Parçalar</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{category.name}</span>
        </nav>

        {/* Brand CTA Banner */}
        <Link
          href="/parcalar"
          className="flex items-center gap-4 p-4 mb-8 bg-primary-50 border border-primary-200 rounded-xl hover:border-primary-400 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/30 transition-colors">
            <Car className="w-5 h-5 text-primary-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-semibold text-sm">Aracınıza uygun parçaları görmek için marka seçin</p>
            <p className="text-gray-500 text-xs">Marka ve model seçerek size özel parça kataloğuna ulaşın</p>
          </div>
          <ChevronRight className="w-5 h-5 text-primary-400 group-hover:text-primary-600 flex-shrink-0 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {category.name}
          </h1>
          <p className="text-gray-500 text-lg max-w-3xl">
            {category.description}. Tüm marka ve modellere uygun yedek ve çıkma parça seçenekleri için aşağıdaki listeyi inceleyin veya WhatsApp üzerinden bize ulaşın.
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6 mb-10">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <h3 className="text-gray-900 font-semibold text-lg mb-1">Fiyat Bilgisi</h3>
              <p className="text-gray-500">
                Sitemizde fiyat bilgisi gösterilmemektedir. Güncel fiyat ve stok durumu için WhatsApp üzerinden iletişime geçin.
              </p>
            </div>
            <a
              href={getWhatsAppUrl(`Merhaba, ${category.name} hakkında fiyat bilgisi almak istiyorum.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-5 h-5" />
              Fiyat Sorun
            </a>
          </div>
        </div>

        {/* Parts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryParts.map((part) => (
            <Link
              key={part.id}
              href={`/parcalar/${params.category}/${part.id}`}
              className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 hover:border-primary-300 transition-all group block"
            >
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {part.categoryName}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-500 transition-colors">
                {part.name}
              </h3>

              <p className="text-gray-500 text-sm mb-4">
                {part.description}
              </p>

              <div className="mb-4">
                <p className="text-gray-400 text-xs mb-2">Uygun Markalar:</p>
                <div className="flex flex-wrap gap-1.5">
                  {part.brands.slice(0, 5).map((brand, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {brand !== 'Tüm Markalar' && <BrandLogo brand={brand} size={14} />}
                      {brand}
                    </span>
                  ))}
                  {part.brands.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{part.brands.length - 5}
                    </span>
                  )}
                </div>
              </div>

              <span className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary-500/10 group-hover:bg-primary-500 text-primary-600 group-hover:text-dark-900 rounded-lg transition-all font-medium">
                Detayları Gör
                <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Aradığınızı Bulamadınız mı?
          </h2>
          <p className="text-gray-500 mb-6 max-w-xl mx-auto">
            {category.name} kategorisinde aradığınız parçayı bulamadıysanız, şase numaranız ile birlikte bize ulaşın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sase-sorgula"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-dark-900 font-semibold rounded-lg transition-all"
            >
              <Search className="w-5 h-5" />
              Şase ile Ara
            </Link>
            <a
              href={getWhatsAppUrl(`Merhaba, ${category.name} kategorisinde bir parça arıyorum ama bulamadım.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp ile Sorun
            </a>
          </div>
        </div>

        {/* Other Categories */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Diğer Kategoriler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories
              .filter(cat => cat.id !== params.category)
              .slice(0, 6)
              .map((cat) => (
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
