'use client'

import { useEffect, useRef, useState } from 'react'

const BRANDS = [
  'volkswagen', 'bmw', 'mercedes-benz', 'audi', 'toyota', 'ford', 'opel', 'renault',
  'peugeot', 'citroen', 'fiat', 'seat', 'skoda', 'volvo', 'honda', 'nissan',
  'hyundai', 'kia', 'mazda', 'subaru', 'jeep', 'land-rover', 'porsche', 'mini',
]

function BrandLogo({ slug }: { slug: string }) {
  const [error, setError] = useState(false)
  const label = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  if (error) {
    return (
      <div className="flex-shrink-0 flex items-center justify-center w-28 h-14 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold">
        {label}
      </div>
    )
  }
  return (
    <div className="flex-shrink-0 flex items-center justify-center w-28 h-14 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-all hover:shadow-sm group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/brands/${slug}.webp`}
        alt={label}
        className="max-h-8 max-w-20 object-contain filter grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all duration-300"
        onError={() => setError(true)}
      />
    </div>
  )
}

export default function BrandMarquee() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-16 md:py-24 bg-white border-y border-gray-100 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            50+ Araç Markası
          </h2>
          <p className="text-gray-400 text-sm">Tüm popüler ve premium markalara ait parçalar tek platformda</p>
        </div>
      </div>

      <div className="relative">
        <div className="flex gap-3 marquee-track">
          {[...BRANDS, ...BRANDS].map((brand, i) => (
            <BrandLogo key={`${brand}-${i}`} slug={brand} />
          ))}
        </div>
      </div>

      <div className="relative mt-3">
        <div className="flex gap-3 marquee-track-reverse">
          {[...BRANDS.slice(12), ...BRANDS.slice(0, 12), ...BRANDS.slice(12), ...BRANDS.slice(0, 12)].map((brand, i) => (
            <BrandLogo key={`rev-${brand}-${i}`} slug={brand} />
          ))}
        </div>
      </div>

      <div className="absolute left-0 inset-y-0 w-24 pointer-events-none" style={{ background: 'linear-gradient(90deg, white, transparent)' }} />
      <div className="absolute right-0 inset-y-0 w-24 pointer-events-none" style={{ background: 'linear-gradient(-90deg, white, transparent)' }} />
    </section>
  )
}
