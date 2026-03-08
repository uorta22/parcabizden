'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// localStorage'da kullanılan anahtar
const CONSENT_KEY = 'cookie-consent'

export default function CookieConsent() {
  // Banner başlangıçta gizli — hydration uyumsuzluğunu önlemek için
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Kullanıcı daha önce kabul etmediyse banneri göster
    const alreadyAccepted = localStorage.getItem(CONSENT_KEY) === 'true'
    if (!alreadyAccepted) {
      // Küçük gecikme ile slide-up animasyonun görünmesini sağla
      const timer = setTimeout(() => setIsVisible(true), 600)
      return () => clearTimeout(timer)
    }
  }, [])

  // Kullanıcı kabul etti — kaydet ve gizle
  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true')
    setIsVisible(false)
  }

  // Görünür değilse hiçbir şey render etme
  if (!isVisible) return null

  return (
    // Ekranın altına sabit — z-50 ile en üstte
    <div
      role="dialog"
      aria-label="Çerez bildirimi"
      className={[
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white border-t border-gray-200 shadow-lg',
        // Yukarı kayma animasyonu
        'animate-slide-up',
      ].join(' ')}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

          {/* Açıklama metni */}
          <p className="text-sm text-gray-600 flex-1">
            Bu web sitesi, deneyiminizi iyileştirmek için çerezleri kullanmaktadır.
            Siteyi kullanmaya devam ederek{' '}
            <Link
              href="/gizlilik-politikasi"
              className="text-primary-600 hover:text-primary-700 underline underline-offset-2 font-medium"
            >
              Gizlilik Politikası
            </Link>
            &apos;nı kabul etmiş sayılırsınız.
          </p>

          {/* Aksiyon butonları */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/gizlilik-politikasi"
              className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
            >
              Gizlilik Politikası
            </Link>

            <button
              onClick={handleAccept}
              className="inline-flex items-center px-5 py-2 rounded-lg text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-dark-900 transition-colors shadow-sm"
            >
              Kabul Et
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
