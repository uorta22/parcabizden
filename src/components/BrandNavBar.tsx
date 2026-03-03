'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_BRANDS = [
  { name: 'BMW', slug: 'bmw' },
  { name: 'Mercedes', slug: 'mercedes-benz' },
  { name: 'Volkswagen', slug: 'volkswagen' },
  { name: 'Audi', slug: 'audi' },
  { name: 'Opel', slug: 'opel' },
  { name: 'Ford', slug: 'ford' },
  { name: 'Renault', slug: 'renault' },
  { name: 'Peugeot', slug: 'peugeot' },
  { name: 'Fiat', slug: 'fiat' },
  { name: 'Toyota', slug: 'toyota' },
  { name: 'Hyundai', slug: 'hyundai' },
  { name: 'Volvo', slug: 'volvo' },
]

function getBrandLogoPath(slug: string): string {
  return `/brands/${slug}.png`
}

export default function BrandNavBar() {
  const pathname = usePathname()

  // Only show on homepage and product pages
  if (pathname !== '/' && !pathname.startsWith('/urunler') && !pathname.startsWith('/urun/')) return null

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
          {NAV_BRANDS.map(brand => (
            <Link
              key={brand.slug}
              href={`/urunler?brand=${brand.slug}`}
              className="flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getBrandLogoPath(brand.slug)}
                alt={brand.name}
                className="w-4 h-4 object-contain"
                loading="lazy"
              />
              {brand.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
