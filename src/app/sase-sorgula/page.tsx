import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, HelpCircle, FileText, Car } from 'lucide-react'
import ChassisSearch from '@/components/ChassisSearch'
import { getWhatsAppUrl } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Şase Numarası ile Parça Sorgula',
  description: 'Şase numarası (VIN) ile aracınıza uygun yedek parça ve çıkma parça arama. 17 haneli şase numaranızı girin, araç bilgilerini görün.',
  keywords: 'şase numarası, VIN sorgu, şase ile parça arama, araç şase, yedek parça sorgulama',
  alternates: { canonical: '/sase-sorgula' },
}

const faqs = [
  {
    question: 'Şase numarası nedir?',
    answer: 'Şase numarası (VIN - Vehicle Identification Number), her araca özel 17 karakterli bir koddur. Bu numara aracınızın kimlik numarası gibidir ve marka, model, yıl, üretim yeri gibi bilgileri içerir.'
  },
  {
    question: 'Şase numarasını nerede bulabilirim?',
    answer: 'Şase numarasını araç ruhsatınızda, ön camın sol alt köşesinde, sürücü kapısı çerçevesinde veya motor bölümünde bulabilirsiniz.'
  },
  {
    question: 'Neden şase numarası gerekli?',
    answer: 'Şase numarası sayesinde aracınıza tam uyumlu parçaları belirleyebiliriz. Aynı model araçlarda bile farklı donanım seviyeleri ve üretim tarihleri nedeniyle parça farklılıkları olabilir.'
  },
  {
    question: 'Şase numaram 17 karakterden az, ne yapmalıyım?',
    answer: 'Bazı eski model araçlarda şase numarası 17 karakterden az olabilir. Bu durumda WhatsApp üzerinden bizimle iletişime geçin, size yardımcı olalım.'
  }
]

export default function SaseSorgulaPage() {
  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Şase Sorgula</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Şase Numarası ile <span className="text-primary-500">Parça Ara</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            17 haneli şase (VIN) numaranızı girin, gerçek araç bilgilerinizi görün ve aracınıza uyumlu tüm parçaları listeleyin.
          </p>
        </div>

        {/* Search Component */}
        <div className="mb-16">
          <ChassisSearch />
        </div>

        {/* How to Find VIN */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Şase Numarası Nerede Bulunur?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-white font-semibold mb-2">Araç Ruhsatı</h3>
              <p className="text-gray-400 text-sm">
                Ruhsatınızın ön yüzünde &quot;Şasi No&quot; veya &quot;VIN&quot; yazan bölümde bulabilirsiniz.
              </p>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-white font-semibold mb-2">Ön Cam</h3>
              <p className="text-gray-400 text-sm">
                Ön camın sol alt köşesinde, dışarıdan görünür şekilde metal bir plakada yazılıdır.
              </p>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Kapı Çerçevesi</h3>
              <p className="text-gray-400 text-sm">
                Sürücü kapısı açıldığında, kapı çerçevesi üzerinde etikette yazılıdır.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Sıkça Sorulan Sorular
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-dark-800 border border-dark-700 rounded-xl p-6"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">{faq.question}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 border border-green-700/50 rounded-2xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-3">
              Yardıma mı İhtiyacınız Var?
            </h2>
            <p className="text-gray-300 mb-6">
              Şase numaranızı bulamıyor veya sorgulama konusunda yardıma ihtiyaç duyuyorsanız WhatsApp üzerinden bize ulaşın.
            </p>
            <a
              href={getWhatsAppUrl('Merhaba, şase numarası sorgulama konusunda yardıma ihtiyacım var.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
            >
              WhatsApp ile Yardım Alın
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
