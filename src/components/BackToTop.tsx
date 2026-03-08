'use client'

import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

// Kaydırma eşiği: bu piksel değerinin üzerinde buton görünür
const SCROLL_THRESHOLD = 300

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Sayfa kaydırma olayını dinle
    const handleScroll = () => {
      setIsVisible(window.scrollY > SCROLL_THRESHOLD)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // Başlangıçta bir kez kontrol et
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Sayfanın en üstüne yumuşak kaydır
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Sayfanın başına dön"
      className={[
        // Sabit konum — ChatWidget'ın (z-50) üstünde değil, altında (z-40)
        'fixed bottom-24 right-4 z-40',
        'w-11 h-11 rounded-full',
        'bg-primary-500 hover:bg-primary-600 text-dark-900',
        'inline-flex items-center justify-center',
        'shadow-lg transition-all duration-300',
        // Görünürlük geçişi
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none',
      ].join(' ')}
    >
      <ChevronUp size={20} strokeWidth={2.5} />
    </button>
  )
}
