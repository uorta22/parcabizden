import type { Metadata } from 'next'
import Link from 'next/link'
import { Settings, Car, Disc, Lightbulb, Battery, Thermometer, Wind, Wrench, Layout, Square, ChevronRight, Search } from 'lucide-react'
import { categories } from '@/data/parts'

export const metadata: Metadata = {
  title: 'Tum Parcalar - Yedek Parca & Cikma Parca | ParcaBizden',
  description: 'Motor parcalari, sanziman, suspansiyon, fren sistemi, kaporta ve daha fazlasi. Tum marka ve modellere uygun yedek parca ve cikma parca.',
  keywords: 'yedek parca, cikma parca, motor parcasi, sanziman, suspansiyon, fren, kaporta, far, elektrik aksam',
}

const iconMap: { [key: string]: any } = {
  Settings,
  Car,
  Disc,
  Lightbulb,
  Battery,
  Thermometer,
  Wind,
  Wrench,
  Layout,
  Square,
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

export default function ParcalarPage() {
  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Tum Parcalar</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Parca <span className="text-primary-500">Kategorileri</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Ihtiyaciniz olan parcayi kategoriye gore bulun. Tum marka ve modellere uygun yedek parca ve cikma parca secenekleri.
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
              <h3 className="text-white font-semibold text-lg mb-1">Sase Numarasi ile Ara</h3>
              <p className="text-gray-400 text-sm">Aracınıza uygun parcalari bulmak icin sase numaranizi girin</p>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-primary-500 transition-colors" />
          </Link>
        </div>

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
                        {category.partCount}+ Parca
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
              Aradiginiz Parcayi Bulamadınız mi?
            </h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto">
              WhatsApp uzerinden bize ulasin, sase numaranizi ve ihtiyaciniz olan parcayi belirtin.
              En kisa surede size donelim.
            </p>
            <a
              href="https://wa.me/905001234567?text=Merhaba,%20bir%20parca%20ariyorum.%20Yardimci%20olur%20musunuz?"
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
