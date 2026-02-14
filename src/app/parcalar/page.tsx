'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Settings, Car, Disc, Lightbulb, Battery, Thermometer, Wind, Wrench, Layout, Square, ChevronRight, Search, MessageCircle } from 'lucide-react'
import { categories } from '@/data/parts'
import { siteConfig, getWhatsAppUrl } from '@/lib/config'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Settings, Car, Disc, Lightbulb, Battery, Thermometer, Wind, Wrench, Layout, Square,
}

const colorMap: { [key: string]: string } = {
  'motor': 'from-red-500 to-orange-500',
  'sanziman': 'from-blue-500 to-cyan-500',
  'suspansiyon': 'from-green-500 to-emerald-500',
  'fren': 'from-purple-500 to-pink-500',
  'kaporta': 'from-yellow-500 to-orange-500',
  'aydinlatma': 'from-amber-500 to-yellow-500',
  'elektrik': 'from-cyan-500 to-blue-500',
  'sogutma': 'from-sky-500 to-indigo-500',
  'egzoz': 'from-gray-500 to-slate-500',
  'direksiyon': 'from-rose-500 to-red-500',
  'ic-aksesuar': 'from-violet-500 to-purple-500',
  'cam': 'from-teal-500 to-cyan-500',
}

interface VehicleModel {
  key: string
  name: string
  slug: string
  image: string
}

interface BrandData {
  id: number
  body_types: Record<string, VehicleModel[]>
}

type VehicleTree = Record<string, BrandData>

function ParcalarContent() {
  const searchParams = useSearchParams()
  const marka = searchParams.get('marka')
  const modelSlug = searchParams.get('model_slug')
  const modelKey = searchParams.get('model_key')

  const [selectedModel, setSelectedModel] = useState<{ brand: string; model: VehicleModel; image: string } | null>(null)

  useEffect(() => {
    if (!marka || !modelSlug) return

    fetch('/data/vehicle-tree.json')
      .then(res => res.json())
      .then((tree: VehicleTree) => {
        const brand = tree[marka]
        if (!brand) return
        for (const models of Object.values(brand.body_types)) {
          const found = models.find(m => m.slug === modelSlug || m.key === modelKey)
          if (found) {
            setSelectedModel({ brand: marka, model: found, image: found.image })
            return
          }
        }
      })
      .catch(() => {})
  }, [marka, modelSlug, modelKey])

  const whatsappText = selectedModel
    ? `Merhaba, ${selectedModel.brand} ${selectedModel.model.name} aracım için parça arıyorum. Yardımcı olur musunuz?`
    : 'Merhaba, bir parça arıyorum. Yardımcı olur musunuz?'

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Tüm Parçalar</span>
        </nav>

        {/* Selected Vehicle Banner */}
        {selectedModel && (
          <div className="mb-8 bg-dark-800 border border-primary-500/30 rounded-2xl p-4 md:p-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
              <div className="w-32 h-20 md:w-40 md:h-24 bg-dark-900 rounded-xl overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedModel.image}
                  alt={selectedModel.model.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs text-primary-500 font-medium mb-1">Seçili Araç</p>
                <h2 className="text-lg md:text-xl font-bold text-white">
                  {selectedModel.brand} {selectedModel.model.name}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Aşağıdan parça kategorisi seçin veya WhatsApp ile bize ulaşın.
                </p>
              </div>
              <a
                href={getWhatsAppUrl(whatsappText)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all flex-shrink-0"
              >
                <MessageCircle className="w-5 h-5" />
                Parça Talep Et
              </a>
            </div>
          </div>
        )}

        {/* Header */}
        {!selectedModel && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Parça <span className="text-primary-500">Kategorileri</span>
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                İhtiyacınız olan parçayı kategoriye göre bulun. Tüm marka ve modellere uygun yedek parça ve çıkma parça seçenekleri.
              </p>
            </div>

            {/* Search Prompt */}
            <div className="max-w-2xl mx-auto mb-12">
              <Link
                href="/sase-sorgula"
                className="flex items-center gap-4 p-6 bg-dark-800 border border-dark-700 rounded-2xl hover:border-primary-500/50 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
                  <Search className="w-7 h-7 text-primary-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">Şase Numarası ile Ara</h3>
                  <p className="text-gray-400 text-sm">Aracınıza uygun parçaları bulmak için şase numaranızı girin</p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-primary-500 transition-colors" />
              </Link>
            </div>
          </>
        )}

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon] || Car
            const gradientColor = colorMap[category.id] || 'from-gray-500 to-gray-600'

            return (
              <Link
                key={category.id}
                href={`/parcalar/${category.id}`}
                className="group bg-dark-800 border border-dark-700 rounded-2xl p-6 hover:border-primary-500/50 transition-all card-hover"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-500 transition-colors">
                      {category.name}
                    </h2>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {category.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-primary-500 text-sm font-medium">
                        {category.partCount}+ Parça
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-secondary-700 to-secondary-900 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Aradığınız Parçayı Bulamadınız mı?
            </h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto">
              WhatsApp üzerinden bize ulaşın, şase numaranızı ve ihtiyacınız olan parçayı belirtin.
              En kısa sürede size dönelim.
            </p>
            <a
              href={getWhatsAppUrl(whatsappText)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
            >
              WhatsApp ile Sorun
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ParcalarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ParcalarContent />
    </Suspense>
  )
}
