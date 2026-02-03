import Link from 'next/link'
import { Car, Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-dark-800 border-t border-dark-700">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
                <Car className="w-6 h-6 text-dark-900" />
              </div>
              <span className="text-xl font-bold text-white">
                Parca<span className="text-primary-500">Bizden</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Yedek parca ve cikma parca ihtiyaclariniz icin guvenilir cozum ortaginiz.
              Tum marka ve modellere uygun parcalar.
            </p>
            <div className="flex gap-3">
              <a
                href="https://wa.me/905001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Hizli Erisim</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/parcalar" className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Tum Parcalar
                </Link>
              </li>
              <li>
                <Link href="/sase-sorgula" className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Sase ile Sorgula
                </Link>
              </li>
              <li>
                <Link href="/parcalar/motor" className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Motor Parcalari
                </Link>
              </li>
              <li>
                <Link href="/parcalar/sanziman" className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Sanziman Parcalari
                </Link>
              </li>
              <li>
                <Link href="/parcalar/suspansiyon" className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Suspansiyon
                </Link>
              </li>
              <li>
                <Link href="/parcalar/elektrik" className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Elektrik Aksam
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">Parca Kategorileri</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/parcalar/kaporta" className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Kaporta Parcalari
                </Link>
              </li>
              <li>
                <Link href="/parcalar/fren" className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Fren Sistemi
                </Link>
              </li>
              <li>
                <Link href="/parcalar/aydinlatma" className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Aydinlatma
                </Link>
              </li>
              <li>
                <Link href="/parcalar/ic-aksesuar" className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Ic Aksesuar
                </Link>
              </li>
              <li>
                <Link href="/parcalar/sogutma" className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Sogutma Sistemi
                </Link>
              </li>
              <li>
                <Link href="/parcalar/egzoz" className="text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Egzoz Sistemi
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Iletisim</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">0500 123 45 67</p>
                  <p className="text-gray-400 text-xs">Sirket Hatti</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">WhatsApp Business</p>
                  <p className="text-gray-400 text-xs">Hizli destek icin</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-400 text-sm">info@parcabizden.com</p>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-400 text-sm">Istanbul, Turkiye</p>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-400 text-sm">Pzt - Cmt: 09:00 - 19:00</p>
                  <p className="text-gray-400 text-sm">Pazar: Kapali</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-dark-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} ParcaBizden. Tum haklari saklidir.
            </p>
            <div className="flex gap-6">
              <Link href="/gizlilik" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                Gizlilik Politikasi
              </Link>
              <Link href="/kullanim-sartlari" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                Kullanim Sartlari
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
