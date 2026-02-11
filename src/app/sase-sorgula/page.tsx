import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, HelpCircle, FileText, Car } from 'lucide-react'
import ChassisSearch from '@/components/ChassisSearch'

export const metadata: Metadata = {
  title: 'Sase Numarasi ile Parca Sorgula | ParcaBizden',
  description: 'Sase numarasi (VIN) ile aracınıza uygun yedek parca ve cikma parca arama. 17 haneli sase numaranizi girin, arac bilgilerini gorun.',
  keywords: 'sase numarasi, VIN sorgu, sase ile parca arama, arac sase, yedek parca sorgulama',
}

const faqs = [
  {
    question: 'Sase numarasi nedir?',
    answer: 'Sase numarasi (VIN - Vehicle Identification Number), her araca ozel 17 karakterli bir koddur. Bu numara aracinizin kimlik numarasi gibidir ve marka, model, yil, uretim yeri gibi bilgileri icerir.'
  },
  {
    question: 'Sase numarasini nerede bulabilirim?',
    answer: 'Sase numarasini arac ruhsatinizda, on camin sol alt kosesinde, surucu kapisi cercevesinde veya motor bolumunde bulabilirsiniz.'
  },
  {
    question: 'Neden sase numarasi gerekli?',
    answer: 'Sase numarasi sayesinde aracınıza tam uyumlu parcalari belirleyebiliriz. Ayni model araclarda bile farkli donanim seviyeleri ve uretim tarihleri nedeniyle parca farkliliklari olabilir.'
  },
  {
    question: 'Sase numaram 17 karakterden az, ne yapmaliyim?',
    answer: 'Bazi eski model araclarda sase numarasi 17 karakterden az olabilir. Bu durumda WhatsApp uzerinden bizimle iletisime gecin, size yardimci olalim.'
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
          <span className="text-white">Sase Sorgula</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Sase Numarasi ile <span className="text-primary-500">Parca Ara</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            17 haneli sase (VIN) numaranizi girin, gercek arac bilgilerinizi gorun ve aracınıza uyumlu tum parcalari listeleyin.
          </p>
        </div>

        {/* Search Component */}
        <div className="mb-16">
          <ChassisSearch />
        </div>

        {/* How to Find VIN */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Sase Numarasi Nerede Bulunur?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-white font-semibold mb-2">Arac Ruhsati</h3>
              <p className="text-gray-400 text-sm">
                Ruhsatinizin on yuzunde "Sasi No" veya "VIN" yazan bolumde bulabilirsiniz.
              </p>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-white font-semibold mb-2">On Cam</h3>
              <p className="text-gray-400 text-sm">
                On camin sol alt kosesinde, disaridan gorunur sekilde metal bir plakada yazilidir.
              </p>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Kapi Cercevesi</h3>
              <p className="text-gray-400 text-sm">
                Surucu kapisi acildiginda, kapi cercevesi uzerinde etikette yazilidir.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Sikca Sorulan Sorular
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
              Yardima mi Ihtiyaciniz Var?
            </h2>
            <p className="text-gray-300 mb-6">
              Sase numaranizi bulamiyor veya sorgulama konusunda yardima ihtiyac duyuyorsaniz WhatsApp uzerinden bize ulasin.
            </p>
            <a
              href="https://wa.me/905001234567?text=Merhaba,%20sase%20numarasi%20sorgulama%20konusunda%20yardima%20ihtiyacim%20var."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
            >
              WhatsApp ile Yardim Alin
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
