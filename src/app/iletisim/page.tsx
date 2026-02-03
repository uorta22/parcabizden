import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Phone, Mail, MapPin, Clock, MessageCircle, Send } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Iletisim - Bize Ulasin | ParcaBizden',
  description: 'ParcaBizden ile iletisime gecin. WhatsApp, telefon veya e-posta ile yedek parca taleplerinizi iletebilirsiniz.',
  keywords: 'iletisim, yedek parca iletisim, whatsapp destek, telefon',
}

export default function IletisimPage() {
  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Iletisim</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Bize <span className="text-primary-500">Ulasin</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Yedek parca ihtiyaclariniz veya sorulariniz icin bizimle iletisime gecin.
            WhatsApp uzerinden aninda destek alin.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Iletisim Bilgileri</h2>

            <div className="space-y-6">
              {/* WhatsApp - Primary */}
              <a
                href="https://wa.me/905001234567?text=Merhaba,%20yedek%20parca%20hakkinda%20bilgi%20almak%20istiyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-6 bg-green-600/20 border border-green-600/50 rounded-xl hover:bg-green-600/30 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">WhatsApp Business</h3>
                  <p className="text-green-400 font-medium">0500 123 45 67</p>
                  <p className="text-gray-400 text-sm mt-1">En hizli iletisim yolu. Aninda cevap alin.</p>
                </div>
              </a>

              {/* Phone */}
              <a
                href="tel:+905001234567"
                className="flex items-start gap-4 p-6 bg-dark-800 border border-dark-700 rounded-xl hover:border-primary-500/50 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-7 h-7 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">Sirket Hatti</h3>
                  <p className="text-primary-500 font-medium">0500 123 45 67</p>
                  <p className="text-gray-400 text-sm mt-1">Telefonla bilgi almak icin arayin.</p>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:info@parcabizden.com"
                className="flex items-start gap-4 p-6 bg-dark-800 border border-dark-700 rounded-xl hover:border-primary-500/50 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-7 h-7 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">E-posta</h3>
                  <p className="text-primary-500 font-medium">info@parcabizden.com</p>
                  <p className="text-gray-400 text-sm mt-1">Detayli talepler icin e-posta gonderin.</p>
                </div>
              </a>

              {/* Address */}
              <div className="flex items-start gap-4 p-6 bg-dark-800 border border-dark-700 rounded-xl">
                <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-7 h-7 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">Adres</h3>
                  <p className="text-gray-300">Istanbul, Turkiye</p>
                  <p className="text-gray-400 text-sm mt-1">Detayli adres bilgisi icin iletisime gecin.</p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-start gap-4 p-6 bg-dark-800 border border-dark-700 rounded-xl">
                <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-7 h-7 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">Calisma Saatleri</h3>
                  <div className="text-gray-300">
                    <p>Pazartesi - Cumartesi: 09:00 - 19:00</p>
                    <p>Pazar: Kapali</p>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">WhatsApp uzerinden 7/24 mesaj birakabilirsiniz.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form / Quick Request */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Hizli Talep Formu</h2>

            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 md:p-8">
              <p className="text-gray-400 mb-6">
                Asagidaki formu doldurun, talebinizi WhatsApp uzerinden bize gonderin.
                En kisa surede size donelim.
              </p>

              <form className="space-y-5" action="https://wa.me/905001234567" method="get" target="_blank">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Adiniz Soyadiniz
                  </label>
                  <input
                    type="text"
                    placeholder="Ornek: Ahmet Yilmaz"
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Telefon Numaraniz
                  </label>
                  <input
                    type="tel"
                    placeholder="0500 000 00 00"
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Arac Bilgisi / Sase No
                  </label>
                  <input
                    type="text"
                    placeholder="Marka, model veya sase numarasi"
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Ihtiyaciniz Olan Parca
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Aradiginiz parcayi detayli sekilde yazin..."
                    className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  />
                </div>

                <a
                  href="https://wa.me/905001234567?text=Merhaba,%20yedek%20parca%20talebi%20gonderiyorum."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                  WhatsApp ile Gonder
                </a>
              </form>

              <p className="text-center text-gray-500 text-sm mt-4">
                Form gonderildiginde WhatsApp acilacaktir.
              </p>
            </div>
          </div>
        </div>

        {/* Map or Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              Neden WhatsApp?
            </h2>
            <p className="text-gray-400 mb-6">
              WhatsApp Business hattimiz sayesinde aradiginiz parcalarin fotograflarini paylasabilir,
              aninda fiyat teklifi alabilir ve siparsinizi hizlica verebilirsiniz.
              Tum gorsel ve yazili iletisiminiz kayit altinda kalir.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-4 py-2 bg-dark-700 rounded-lg text-gray-300 text-sm">
                Aninda Cevap
              </div>
              <div className="px-4 py-2 bg-dark-700 rounded-lg text-gray-300 text-sm">
                Fotograf Paylasimi
              </div>
              <div className="px-4 py-2 bg-dark-700 rounded-lg text-gray-300 text-sm">
                Kolay Takip
              </div>
              <div className="px-4 py-2 bg-dark-700 rounded-lg text-gray-300 text-sm">
                7/24 Mesaj
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
