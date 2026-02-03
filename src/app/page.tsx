import Link from 'next/link'
import { Search, Shield, Truck, Clock, Phone, MessageCircle, ChevronRight, Car, Settings, Disc, Lightbulb, Battery, Thermometer, Wind, Wrench } from 'lucide-react'
import CarDiagram from '@/components/CarDiagram'
import ChassisSearch from '@/components/ChassisSearch'

const categories = [
  { id: 'motor', name: 'Motor Parcalari', icon: Settings, count: '500+', color: 'from-red-500 to-orange-500' },
  { id: 'sanziman', name: 'Sanziman', icon: Settings, count: '300+', color: 'from-blue-500 to-cyan-500' },
  { id: 'suspansiyon', name: 'Suspansiyon', icon: Car, count: '400+', color: 'from-green-500 to-emerald-500' },
  { id: 'fren', name: 'Fren Sistemi', icon: Disc, count: '250+', color: 'from-purple-500 to-pink-500' },
  { id: 'kaporta', name: 'Kaporta', icon: Car, count: '600+', color: 'from-yellow-500 to-orange-500' },
  { id: 'aydinlatma', name: 'Aydinlatma', icon: Lightbulb, count: '350+', color: 'from-amber-500 to-yellow-500' },
  { id: 'elektrik', name: 'Elektrik Aksam', icon: Battery, count: '200+', color: 'from-cyan-500 to-blue-500' },
  { id: 'sogutma', name: 'Sogutma Sistemi', icon: Thermometer, count: '150+', color: 'from-sky-500 to-indigo-500' },
  { id: 'egzoz', name: 'Egzoz Sistemi', icon: Wind, count: '180+', color: 'from-gray-500 to-slate-500' },
  { id: 'direksiyon', name: 'Direksiyon', icon: Wrench, count: '120+', color: 'from-rose-500 to-red-500' },
]

const features = [
  {
    icon: Shield,
    title: 'Kalite Garantisi',
    description: 'Tum parcalarimiz titizlikle kontrol edilir ve kalite standartlarimiza uygun sekilde sunulur.'
  },
  {
    icon: Truck,
    title: 'Hizli Teslimat',
    description: 'Turkiye genelinde hizli kargo secenekleri ile parcalariniz kapiniza kadar gelir.'
  },
  {
    icon: Clock,
    title: 'Aninda Destek',
    description: 'WhatsApp Business hattimiz ile aninda destek alin, sorularinizi hemen cevaplayalim.'
  },
  {
    icon: Search,
    title: 'Sase ile Arama',
    description: 'Sase numaranizi girin, aracınıza uygun tum parcalari aninda listeleyin.'
  }
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 gradient-primary"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <span className="inline-block px-4 py-2 bg-primary-500/20 text-primary-500 rounded-full text-sm font-medium mb-6">
              Turkiye'nin Guvenilir Yedek Parca Platformu
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Yedek Parca & Cikma Parca
              <span className="text-primary-500"> Talep Platformu</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Arac sahibi veya kasko eksperisiniz, ihtiyaciniz olan parcayi hizlica bulun.
              Sase numarasi ile arama yapin, WhatsApp uzerinden aninda teklif alin.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/sase-sorgula"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-dark-900 font-semibold rounded-xl transition-all hover:scale-105"
              >
                <Search className="w-5 h-5" />
                Sase ile Sorgula
              </Link>
              <a
                href="https://wa.me/905001234567?text=Merhaba,%20yedek%20parca%20hakkinda%20bilgi%20almak%20istiyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all hover:scale-105"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp ile Ulasin
              </a>
            </div>

            {/* Quick Contact */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-400">
              <a href="tel:+905001234567" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-5 h-5 text-primary-500" />
                <span>0500 123 45 67</span>
              </a>
              <span className="hidden sm:block">|</span>
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" />
                <span>Pzt-Cmt: 09:00 - 19:00</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Chassis Search Section */}
      <section className="py-16 bg-dark-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Sase Numarasi ile <span className="text-primary-500">Hizli Arama</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              17 haneli sase (VIN) numaranizi girin, aracınıza uygun tum parcalari aninda gorun.
            </p>
          </div>
          <ChassisSearch />
        </div>
      </section>

      {/* Interactive Car Diagram Section */}
      <section className="py-16 md:py-24 bg-dark-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Parca Secin, <span className="text-primary-500">Talep Olusturun</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Arac semasi uzerinde ihtiyaciniz olan parcayi secin, detaylari gorun ve WhatsApp uzerinden hemen talep gonderin.
            </p>
          </div>
          <CarDiagram />
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-dark-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Parca <span className="text-primary-500">Kategorileri</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Tum marka ve modellere uygun yedek parca ve cikma parca cesitlerimizi kesfedin.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/parcalar/${category.id}`}
                className="group bg-dark-900 border border-dark-700 rounded-xl p-5 hover:border-primary-500/50 transition-all card-hover"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-1 group-hover:text-primary-500 transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-500 text-sm">{category.count} Parca</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/parcalar"
              className="inline-flex items-center gap-2 px-6 py-3 border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-dark-900 rounded-lg transition-all font-medium"
            >
              Tum Parcalari Gor
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-dark-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Neden <span className="text-primary-500">ParcaBizden?</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Yilların tecrubesi ve musteri memnuniyeti odakli hizmet anlayisimiz ile yaninizdayiz.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:border-primary-500/30 transition-all card-hover"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-secondary-700 to-secondary-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Aradiginiz Parcayi Bulamadınız mi?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              WhatsApp uzerinden bize ulasin, ihtiyaciniz olan parcayi sizin icin bulalim.
              Sase numaranizi ve ihtiyaciniz olan parcayi belirtin, en kisa surede donelim.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/905001234567?text=Merhaba,%20bir%20parca%20ariyorum%20ama%20bulamadim.%20Yardimci%20olur%20musunuz?"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all hover:scale-105"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp ile Sorun
              </a>
              <a
                href="tel:+905001234567"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/20"
              >
                <Phone className="w-5 h-5" />
                0500 123 45 67
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-dark-800 border-t border-dark-700">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-gray-500">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">5000+</p>
              <p className="text-sm">Mutlu Musteri</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">10.000+</p>
              <p className="text-sm">Parca Cesidi</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">50+</p>
              <p className="text-sm">Marka</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">7/24</p>
              <p className="text-sm">WhatsApp Destek</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
