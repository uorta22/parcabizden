import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Shield, Users, Award, Target, CheckCircle, MessageCircle } from 'lucide-react'
import { getWhatsAppUrl } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Hakkımızda - ParcaBizden',
  description: 'ParcaBizden hakkında bilgi edinin. Yedek parça ve çıkma parça sektöründe güvenilir çözüm ortağınız.',
  keywords: 'hakkımızda, parcabizden, yedek parça firması, çıkma parça',
}

const values = [
  {
    icon: Shield,
    title: 'Güvenilirlik',
    description: 'Tüm parçalarımız titizlikle kontrol edilir. Müşteri memnuniyeti bizim için her şeyden önemlidir.'
  },
  {
    icon: Users,
    title: 'Müşteri Odaklılık',
    description: 'Her müşterimizin ihtiyacını anlayarak en uygun çözümü sunmak için çalışıyoruz.'
  },
  {
    icon: Award,
    title: 'Kalite',
    description: 'Kaliteden ödün vermeden, her bütçeye uygun parça seçenekleri sunuyoruz.'
  },
  {
    icon: Target,
    title: 'Hız',
    description: 'WhatsApp üzerinden anında iletişim, hızlı fiyat teklifi ve hızlı teslimat.'
  }
]

const highlights = [
  '5000+ mutlu müşteri',
  '10.000+ parça çeşidi',
  '50+ marka desteği',
  'Türkiye genelinde kargo',
  '7/24 WhatsApp destek',
  'Tecrübeli teknik ekip'
]

export default function HakkimizdaPage() {
  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Hakkımızda</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Yedek Parça Sektöründe
            <span className="text-primary-500"> Güvenilir Çözüm Ortağınız</span>
          </h1>
          <p className="text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed">
            ParcaBizden olarak, araç sahipleri ve kasko eksperleri için yedek parça ve çıkma parça
            tedarikinde güvenilir bir köprü olmak amacımızdır. Kaliteli parçaları uygun koşullarda
            size ulaştırmak için çalışıyoruz.
          </p>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
            Değerlerimiz
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-dark-800 border border-dark-700 rounded-xl p-6 text-center hover:border-primary-500/30 transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* About Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Biz Kimiz?
            </h2>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>
                ParcaBizden, otomotiv sektöründe yılların tecrübesiyle yedek parça ve çıkma parça
                tedarikinde uzmanlaşmış bir platformdur. Amacımız, araç sahiplerinin ve kasko
                eksperlerinin doğru parçaya hızlı ve güvenilir şekilde ulaşmalarını sağlamaktır.
              </p>
              <p>
                Geniş parça ağımız ve tecrübeli ekibimiz sayesinde, tüm marka ve modellere uygun
                parçaları bulmanızda size yardımcı oluyoruz. Şase numaranız ile arama yaparak
                aracınıza tam uyumlu parçaları kolayca tespit edebilirsiniz.
              </p>
              <p>
                WhatsApp Business hattımız üzerinden 7/24 mesaj bırakabilir, iş saatlerinde anında
                cevap alabilirsiniz. Fotoğraf paylaşımı ile ihtiyacınız olan parçayı net şekilde
                belirtebilir, hızlı fiyat teklifi alabilirsiniz.
              </p>
            </div>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">Neden Biz?</h3>
            <div className="grid grid-cols-2 gap-4">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 md:p-12 mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
            Kimler İçin Hizmet Veriyoruz?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Araç Sahipleri</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Aracınız için ihtiyacınız olan yedek veya çıkma parçayı uygun fiyatlarla
                bulmanıza yardımcı oluyoruz. Şase numaranız ile arama yaparak doğru
                parçaya ulaşın.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Kasko Eksperleri</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Hasar tespitlerinde ihtiyacınız olan parçaların tedarikinde size
                yardımcı oluyoruz. Toplu talepleriniz için özel iletişim kanalınız.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-secondary-700 to-secondary-900 rounded-2xl p-8 md:p-12 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Hemen İletişime Geçin
            </h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              Yedek parça ihtiyaçlarınız için WhatsApp üzerinden bize ulaşın.
              Tecrübeli ekibimiz size en kısa sürede dönecektir.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp ile Ulaşın
              </a>
              <Link
                href="/iletisim"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/20"
              >
                İletişim Bilgileri
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
