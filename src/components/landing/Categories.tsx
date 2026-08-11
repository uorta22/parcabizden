/**
 * Categories — parça kategorileri grid'i.
 *
 * Liste @/lib/part-categories'ten geliyor: satıcının ilan verirken seçtiği
 * kategoriyle buradaki chip'ler aynı slug'ı kullansın diye. Chip /ilanlar'a
 * kategori filtresiyle gider.
 */

import Link from 'next/link'
import {
  Disc3, Cog, Wrench, Zap, Car as CarIcon, Settings2, Armchair,
} from 'lucide-react'
import { PART_CATEGORY_GROUPS } from '@/lib/part-categories'

const ACCENT = '#ff7a1a'

const GROUP_ICONS: Record<string, typeof Disc3> = {
  'fren-debriyaj': Disc3,
  'motor-yakit': Cog,
  'suspansiyon-direksiyon': Wrench,
  'elektrik-aydinlatma': Zap,
  'kaporta-trim': CarIcon,
  'sanziman-aktarma': Settings2,
  'ic-donanim': Armchair,
}


export default function Categories() {
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">
              Tüm Kategoriler
            </h2>
            <p className="text-sm text-gray-500">Aradığınız parçayı kategoriye göre bulun</p>
          </div>
          <Link
            href="/ilanlar"
            className="text-sm font-semibold underline-offset-4 hover:underline"
            style={{ color: ACCENT }}
          >
            Tümünü gör →
          </Link>
        </header>

        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PART_CATEGORY_GROUPS.map(({ slug: groupSlug, title, items }) => {
            const Icon = GROUP_ICONS[groupSlug] ?? Cog
            return (
            <li key={title}>
              <article className="h-full rounded-xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#ff7a1a]/40 hover:shadow-md">
                <header className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg"
                    style={{ background: `${ACCENT}15`, color: ACCENT }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <h3 className="font-bold text-gray-900">{title}</h3>
                </header>
                <ul className="flex flex-wrap gap-1.5">
                  {items.map(it => (
                    <li key={it.slug}>
                      <Link
                        href={`/ilanlar?category=${it.slug}`}
                        className="inline-block rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition-colors hover:border-[#ff7a1a]/50 hover:text-[#ff7a1a]"
                      >
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
