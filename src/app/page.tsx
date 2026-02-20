import Link from 'next/link'
import { Shield, Truck, Clock, Search, Phone, MessageCircle, ChevronRight, Car, Settings, Disc, Lightbulb, Battery, Thermometer, Wind, Wrench } from 'lucide-react'
import HeroSection from '@/components/HeroSection'
import OemSearchBox from '@/components/OemSearchBox'
import BrandModelSelector from '@/components/BrandModelSelector'

import { siteConfig, getWhatsAppUrl, getPhoneUrl } from '@/lib/config'

const categories = [
  { id: 'motor', name: 'Motor Parçaları', icon: Settings, count: '500+', color: 'from-red-500 to-orange-500' },
  { id: 'sanziman', name: 'Şanzıman', icon: Settings, count: '300+', color: 'from-blue-500 to-cyan-500' },
  { id: 'suspansiyon', name: 'Süspansiyon', icon: Car, count: '400+', color: 'from-green-500 to-emerald-500' },
  { id: 'fren', name: 'Fren Sistemi', icon: Disc, count: '250+', color: 'from-purple-500 to-pink-500' },
  { id: 'kaporta', name: 'Kaporta', icon: Car, count: '600+', color: 'from-yellow-500 to-orange-500' },
  { id: 'aydinlatma', name: 'Aydınlatma', icon: Lightbulb, count: '350+', color: 'from-amber-500 to-yellow-500' },
  { id: 'elektrik', name: 'Elektrik Aksamı', icon: Battery, count: '200+', color: 'from-cyan-500 to-blue-500' },
  { id: 'sogutma', name: 'Soğutma Sistemi', icon: Thermometer, count: '150+', color: 'from-sky-500 to-indigo-500' },
  { id: 'egzoz', name: 'Egzoz Sistemi', icon: Wind, count: '180+', color: 'from-gray-500 to-slate-500' },
  { id: 'direksiyon', name: 'Direksiyon', icon: Wrench, count: '120+', color: 'from-rose-500 to-red-500' },
]

const features = [
  {
    icon: Shield,
    title: 'Kalite Garantisi',
    description: 'Tüm parçalarımız titizlikle kontrol edilir ve kalite standartlarımıza uygun şekilde sunulur.'
  },
  {
    icon: Truck,
    title: 'Hızlı Teslimat',
    description: 'Türkiye genelinde hızlı kargo seçenekleri ile parçalarınız kapınıza kadar gelir.'
  },
  {
    icon: Clock,
    title: 'Anında Destek',
    description: 'WhatsApp Business hattımız ile anında destek alın, sorularınızı hemen cevaplayalım.'
  },
  {
    icon: Search,
    title: 'Şase ile Arama',
    description: 'Şase numaranızı girin, aracınıza uygun tüm parçaları anında listeleyin.'
  }
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero - Motto + VIN Search + CTAs */}
      <HeroSection />

      {/* OEM Number Search */}
      <OemSearchBox />

      {/* Brand / Model Selector */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Marka ve Model <span className="text-primary-500">Seçin</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Aracınızın markasını seçin, modele özel uyumlu parçaları görüntüleyin.
            </p>
          </div>
          <BrandModelSelector />
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Parça <span className="text-primary-500">Kategorileri</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Tüm marka ve modellere uygun yedek parça ve çıkma parça çeşitlerimizi keşfedin.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/parcalar/${category.id}`}
                className="group bg-white border border-gray-200 shadow-sm rounded-xl p-5 hover:border-primary-500/50 transition-all card-hover"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-gray-900 font-semibold mb-1 group-hover:text-primary-500 transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-400 text-sm">{category.count} Parça</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/parcalar"
              className="inline-flex items-center gap-2 px-6 py-3 border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white rounded-lg transition-all font-medium"
            >
              Tüm Parçaları Gör
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Neden <span className="text-primary-500">ParcaBizden?</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Yılların tecrübesi ve müşteri memnuniyeti odaklı hizmet anlayışımız ile yanınızdayız.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 hover:border-primary-500/30 transition-all card-hover"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-secondary-700 to-secondary-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Aradığınız Parçayı Bulamadınız mı?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              WhatsApp üzerinden bize ulaşın, ihtiyacınız olan parçayı sizin için bulalım.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={getWhatsAppUrl(siteConfig.whatsapp.notFoundMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all hover:scale-105"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp ile Sorun
              </a>
              <a
                href={getPhoneUrl()}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/20"
              >
                <Phone className="w-5 h-5" />
                {siteConfig.phone.display}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-gray-400">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">5000+</p>
              <p className="text-sm">Mutlu Müşteri</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">10.000+</p>
              <p className="text-sm">Parça Çeşidi</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">50+</p>
              <p className="text-sm">Marka</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">7/24</p>
              <p className="text-sm">WhatsApp Destek</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
