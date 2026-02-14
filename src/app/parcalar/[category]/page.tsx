import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, MessageCircle, Search } from 'lucide-react'
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
    description: `${category.name}: ${category.description}. Tüm marka ve modellere uygun yedek parça ve çıkma parça seçenekleri.`,
    keywords: `${category.name.toLowerCase()}, yedek parça, çıkma parça, oto parça`,
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
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/parcalar" className="hover:text-white transition-colors">Parçalar</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {category.name}
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl">
            {category.description}. Tüm marka ve modellere uygun yedek ve çıkma parça seçenekleri için aşağıdaki listeyi inceleyin veya WhatsApp üzerinden bize ulaşın.
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6 mb-10">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg mb-1">Fiyat Bilgisi</h3>
              <p className="text-gray-400">
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
            <div
              key={part.id}
              className="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:border-primary-500/30 transition-all group"
            >
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-secondary-600/50 text-secondary-300 rounded-full text-xs font-medium">
                  {part.categoryName}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-500 transition-colors">
                {part.name}
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                {part.description}
              </p>

              <div className="mb-4">
                <p className="text-gray-500 text-xs mb-2">Uygun Markalar:</p>
                <div className="flex flex-wrap gap-1.5">
                  {part.brands.slice(0, 5).map((brand, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-dark-700 text-gray-400 rounded text-xs"
                    >
                      {brand !== 'Tüm Markalar' && <BrandLogo brand={brand} size={14} />}
                      {brand}
                    </span>
                  ))}
                  {part.brands.length > 5 && (
                    <span className="px-2 py-1 bg-dark-700 text-gray-400 rounded text-xs">
                      +{part.brands.length - 5}
                    </span>
                  )}
                </div>
              </div>

              <a
                href={getWhatsAppUrl(`Merhaba, ${part.name} parçası hakkında bilgi almak istiyorum.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600/20 hover:bg-green-600 text-green-500 hover:text-white rounded-lg transition-all font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp ile Talep Et
              </a>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-dark-800 border border-dark-700 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Aradığınızı Bulamadınız mı?
          </h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
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
          <h2 className="text-2xl font-bold text-white mb-6">Diğer Kategoriler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories
              .filter(cat => cat.id !== params.category)
              .slice(0, 6)
              .map((cat) => (
                <Link
                  key={cat.id}
                  href={`/parcalar/${cat.id}`}
                  className="bg-dark-800 border border-dark-700 rounded-lg p-4 text-center hover:border-primary-500/50 transition-all group"
                >
                  <p className="text-white font-medium text-sm group-hover:text-primary-500 transition-colors">
                    {cat.name}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{cat.partCount}+ Parça</p>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
