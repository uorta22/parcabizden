import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Phone, Mail, MapPin, Clock, MessageCircle, Send } from 'lucide-react'
import { siteConfig, getWhatsAppUrl, getPhoneUrl, getEmailUrl } from '@/lib/config'

export const metadata: Metadata = {
  title: 'İletişim - Bize Ulaşın',
  description: `${siteConfig.name} ile iletişime geçin. WhatsApp, telefon veya e-posta ile yedek parça taleplerinizi iletebilirsiniz.`,
  keywords: 'iletişim, yedek parça iletişim, whatsapp destek, telefon',
  alternates: { canonical: '/iletisim' },
}

export default function IletisimPage() {
  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">İletişim</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Bize <span className="text-primary-500">Ulaşın</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Yedek parça ihtiyaçlarınız veya sorularınız için bizimle iletişime geçin.
            WhatsApp üzerinden anında destek alın.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">İletişim Bilgileri</h2>

            <div className="space-y-6">
              {/* WhatsApp - Primary */}
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-6 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-lg mb-1">WhatsApp Business</h3>
                  <p className="text-green-600 font-medium">{siteConfig.phone.display}</p>
                  <p className="text-gray-500 text-sm mt-1">En hızlı iletişim yolu. Anında cevap alın.</p>
                </div>
              </a>

              {/* Phone */}
              <a
                href={getPhoneUrl()}
                className="flex items-start gap-4 p-6 bg-white border border-gray-200 shadow-sm rounded-xl hover:border-primary-400 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-7 h-7 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-lg mb-1">Şirket Hattı</h3>
                  <p className="text-primary-500 font-medium">{siteConfig.phone.display}</p>
                  <p className="text-gray-500 text-sm mt-1">Telefonla bilgi almak için arayın.</p>
                </div>
              </a>

              {/* Email */}
              <a
                href={getEmailUrl()}
                className="flex items-start gap-4 p-6 bg-white border border-gray-200 shadow-sm rounded-xl hover:border-primary-400 transition-colors group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-7 h-7 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-lg mb-1">E-posta</h3>
                  <p className="text-primary-500 font-medium">{siteConfig.email}</p>
                  <p className="text-gray-500 text-sm mt-1">Detaylı talepler için e-posta gönderin.</p>
                </div>
              </a>

              {/* Address */}
              <div className="flex items-start gap-4 p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-7 h-7 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-lg mb-1">Adres</h3>
                  <p className="text-gray-700">{siteConfig.address.full}</p>
                  <p className="text-gray-500 text-sm mt-1">Detaylı adres bilgisi için iletişime geçin.</p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-start gap-4 p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-7 h-7 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-lg mb-1">Çalışma Saatleri</h3>
                  <div className="text-gray-700">
                    <p>{siteConfig.workingHours.weekdays}</p>
                    <p>{siteConfig.workingHours.weekend}</p>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{siteConfig.workingHours.whatsappNote}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form / Quick Request */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Hızlı Talep Formu</h2>

            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 md:p-8">
              <p className="text-gray-500 mb-6">
                Aşağıdaki formu doldurun, talebinizi WhatsApp üzerinden bize gönderin.
                En kısa sürede size dönelim.
              </p>

              <form className="space-y-5" action={getWhatsAppUrl(siteConfig.whatsapp.partRequestMessage)} method="get" target="_blank">
                <div>
                  <label htmlFor="contact-name" className="block text-gray-700 text-sm font-medium mb-2">
                    Adınız Soyadınız
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Örnek: Ahmet Yılmaz"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="contact-phone" className="block text-gray-700 text-sm font-medium mb-2">
                    Telefon Numaranız
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    placeholder="0500 000 00 00"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="contact-vehicle" className="block text-gray-700 text-sm font-medium mb-2">
                    Araç Bilgisi / Şase No
                  </label>
                  <input
                    id="contact-vehicle"
                    type="text"
                    placeholder="Marka, model veya şase numarası"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="contact-part" className="block text-gray-700 text-sm font-medium mb-2">
                    İhtiyacınız Olan Parça
                  </label>
                  <textarea
                    id="contact-part"
                    rows={4}
                    placeholder="Aradığınız parçayı detaylı şekilde yazın..."
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  />
                </div>

                <a
                  href={getWhatsAppUrl('Merhaba, yedek parça talebi göndermek istiyorum.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                  WhatsApp ile Gönder
                </a>
              </form>

              <p className="text-center text-gray-500 text-sm mt-4">
                Form gönderildiğinde WhatsApp açılacaktır.
              </p>
            </div>
          </div>
        </div>

        {/* Map or Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Neden WhatsApp?
            </h2>
            <p className="text-gray-500 mb-6">
              WhatsApp Business hattımız sayesinde aradığınız parçaların fotoğraflarını paylaşabilir,
              anında fiyat teklifi alabilir ve siparişinizi hızlıca verebilirsiniz.
              Tüm görsel ve yazılı iletişiminiz kayıt altında kalır.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 text-sm">
                Anında Cevap
              </div>
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 text-sm">
                Fotoğraf Paylaşımı
              </div>
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 text-sm">
                Kolay Takip
              </div>
              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 text-sm">
                7/24 Mesaj
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
