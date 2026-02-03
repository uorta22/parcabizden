import Link from 'next/link'
import { Home, Search, MessageCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <span className="text-8xl font-bold text-primary-500">404</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Sayfa Bulunamadi
          </h1>
          <p className="text-gray-400 mb-8">
            Aradiginiz sayfa mevcut degil veya tasınmis olabilir.
            Asagidaki baglantilari kullanarak devam edebilirsiniz.
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
              href="/parcalar"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-lg transition-all border border-dark-600"
            >
              <Search className="w-5 h-5" />
              Parcalar
            </Link>
          </div>
          <div className="mt-8">
            <a
              href="https://wa.me/905001234567?text=Merhaba,%20site%20uzerinde%20bir%20sorun%20yasadim."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Yardima mi ihtiyaciniz var? WhatsApp ile yazin
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
