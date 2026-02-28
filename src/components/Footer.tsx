import Link from 'next/link'
import { Car, Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react'
import { siteConfig, getWhatsAppUrl } from '@/lib/config'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
                <Car className="w-6 h-6 text-dark-900" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Parça<span className="text-primary-500">Bizden</span>
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              Yedek parça ve çıkma parça ihtiyaçlarınız için güvenilir çözüm ortağınız.
              Tüm marka ve modellere uygun parçalar.
            </p>
            <div className="flex gap-3">
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors"
                aria-label="WhatsApp ile iletişime geçin"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Hızlı Erişim</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/parcalar" className="text-gray-500 hover:text-primary-500 transition-colors text-sm">
                  Tüm Parçalar
                </Link>
              </li>
              <li>
                <Link href="/sase-sorgula" className="text-gray-500 hover:text-primary-500 transition-colors text-sm">
                  Şase ile Sorgula
                </Link>
              </li>
              <li>
                <Link href="/parcalar/motor" className="text-gray-500 hover:text-primary-500 transition-colors text-sm">
                  Motor Parçaları
                </Link>
              </li>
              <li>
                <Link href="/parcalar/sanziman" className="text-gray-500 hover:text-primary-500 transition-colors text-sm">
                  Şanzıman Parçaları
                </Link>
              </li>
              <li>
                <Link href="/parcalar/suspansiyon" className="text-gray-500 hover:text-primary-500 transition-colors text-sm">
                  Süspansiyon
                </Link>
              </li>
              <li>
                <Link href="/parcalar/elektrik" className="text-gray-500 hover:text-primary-500 transition-colors text-sm">
                  Elektrik Aksamı
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Models */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Popüler Modeller</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/parcalar?brand=bmw&marka=BMW&model_name=3%20Serisi" className="text-gray-500 hover:text-primary-500 transition-colors text-sm">
                  BMW 3 Serisi
                </Link>
              </li>
              <li>
                <Link href="/parcalar?brand=mercedes-benz&marka=Mercedes-Benz&model_name=C%20Serisi" className="text-gray-500 hover:text-primary-500 transition-colors text-sm">
                  Mercedes C Serisi
                </Link>
              </li>
              <li>
                <Link href="/parcalar?brand=volkswagen&marka=Volkswagen&model_name=Golf" className="text-gray-500 hover:text-primary-500 transition-colors text-sm">
                  VW Golf
                </Link>
              </li>
              <li>
                <Link href="/parcalar?brand=audi&marka=Audi&model_name=A4" className="text-gray-500 hover:text-primary-500 transition-colors text-sm">
                  Audi A4
                </Link>
              </li>
              <li>
                <Link href="/parcalar?brand=toyota&marka=Toyota&model_name=Corolla" className="text-gray-500 hover:text-primary-500 transition-colors text-sm">
                  Toyota Corolla
                </Link>
              </li>
              <li>
                <Link href="/parcalar?brand=ford&marka=Ford&model_name=Focus" className="text-gray-500 hover:text-primary-500 transition-colors text-sm">
                  Ford Focus
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">İletişim</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-900 text-sm font-medium">{siteConfig.phone.display}</p>
                  <p className="text-gray-500 text-xs">Şirket Hattı</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-900 text-sm font-medium">WhatsApp Business</p>
                  <p className="text-gray-500 text-xs">Hızlı destek için</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-500 text-sm">{siteConfig.email}</p>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-500 text-sm">{siteConfig.address.full}</p>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-500 text-sm">{siteConfig.workingHours.weekdays}</p>
                  <p className="text-gray-500 text-sm">{siteConfig.workingHours.weekend}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} ParcaBizden. Tüm hakları saklıdır.
            </p>
            <div className="flex gap-6">
              <Link href="/gizlilik" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
                Gizlilik Politikası
              </Link>
              <Link href="/kullanim-sartlari" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
                Kullanım Şartları
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
