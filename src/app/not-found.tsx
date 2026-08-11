import Link from 'next/link'
import { Home, Search, MessageCircle } from 'lucide-react'
import { getWhatsAppUrl } from '@/lib/config'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <span className="text-8xl font-bold text-primary-500">404</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Sayfa Bulunamadı
          </h1>
          <p className="text-gray-500 mb-8">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
            Aşağıdaki bağlantıları kullanarak devam edebilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-dark-900 font-semibold rounded-lg transition-all"
            >
              <Home className="w-5 h-5" />
              Ana Sayfa
            </Link>
            <Link
              href="/ilanlar"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg transition-all border border-gray-200"
            >
              <Search className="w-5 h-5" />
              Parçalar
            </Link>
          </div>
          <div className="mt-8">
            <a
              href={getWhatsAppUrl('Merhaba, site üzerinde bir sorun yaşadım.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Yardıma mı ihtiyacınız var? WhatsApp ile yazın
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
