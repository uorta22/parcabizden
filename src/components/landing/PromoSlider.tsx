'use client'

/**
 * PromoSlider — kampanya banner'ları.
 *
 * Şimdilik statik veri (kod içinde) — ileride Supabase'den çekilecek
 * (campaigns tablosu ekleneceğinde supabase.from('campaigns').select()).
 *
 * Davranış: otomatik 5sn'de bir sıradakine geç + manuel ok/dot.
 * Tıklanabilir — her slide'ın href'i var.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const ACCENT = '#ff7a1a'

type Promo = {
  id: number
  title: string
  body: string
  badge: string
  href: string
  bgFrom: string  // tailwind gradient from class
  bgTo: string    // tailwind gradient to class
}

// TODO: Supabase 'campaigns' tablosundan dinamik gelecek
const PROMOS: Promo[] = [
  {
    id: 1,
    title: '%0 Komisyon ve Ücretsiz Kargo',
    body: '5000₺ üzeri tüm siparişlerde ücretsiz kargo, 7500₺ üzeri 2 taksitte %0 komisyon.',
    badge: 'Kampanya',
    href: '/parcalar',
    bgFrom: 'from-orange-500',
    bgTo: 'to-amber-600',
  },
  {
    id: 2,
    title: 'Garaja Araç Ekle, Hızlı Eriş',
    body: 'Aracınızı garajınıza kaydedin — bir daha marka/model seçmek zorunda kalmayın.',
    badge: 'Üyelik',
    href: '/hesabim/garaj',
    bgFrom: 'from-sky-500',
    bgTo: 'to-blue-600',
  },
  {
    id: 3,
    title: 'TecDoc Onaylı Parça Garantisi',
    body: 'Her parça TecDoc kataloğu üzerinden aracınıza birebir uyumluluk testinden geçirilir.',
    badge: 'Kalite',
    href: '/parcalar',
    bgFrom: 'from-emerald-500',
    bgTo: 'to-teal-600',
  },
]

export default function PromoSlider() {
  const [idx, setIdx] = useState(0)
  const total = PROMOS.length

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % total), 5000)
    return () => clearInterval(t)
  }, [total])

  const prev = () => setIdx(i => (i - 1 + total) % total)
  const next = () => setIdx(i => (i + 1) % total)

  const p = PROMOS[idx]

  return (
    <section className="border-y border-gray-200 bg-white py-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${p.bgFrom} ${p.bgTo}`}>
          <Link href={p.href} className="block px-6 py-6 md:px-10 md:py-8">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1 text-white">
                <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-0.5 text-[11px] font-semibold tracking-wider backdrop-blur">
                  {p.badge.toUpperCase()}
                </span>
                <h3 className="text-lg font-bold leading-tight md:text-2xl">{p.title}</h3>
                <p className="mt-1 text-sm text-white/90 md:text-base">{p.body}</p>
              </div>
              <ChevronRight className="hidden h-8 w-8 flex-shrink-0 text-white/80 sm:block" />
            </div>
          </Link>

          {/* Yön okları */}
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-1.5 text-white backdrop-blur transition-colors hover:bg-white/25 md:block"
            aria-label="Önceki kampanya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-1.5 text-white backdrop-blur transition-colors hover:bg-white/25 md:block"
            aria-label="Sonraki kampanya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {PROMOS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`${i + 1}. kampanyaya git`}
                className="h-1.5 rounded-full transition-all"
                style={{
                  background: i === idx ? '#fff' : 'rgba(255,255,255,0.4)',
                  width: i === idx ? '20px' : '6px',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
