/**
 * Categories — popüler parça kategorileri grid.
 *
 * Tasarım kararları:
 *  • Daha hızlı discovery: kategori → /parcalar?cat= filtresine giderim
 *  • Sade ikon + kategori ismi; gradient/glow yok
 *  • 4×2 mobilde 2×4
 */

import Link from 'next/link'
import { Disc3, Lightbulb, Battery, Wrench, Wind, Cog, Filter, Package } from 'lucide-react'

const CATEGORIES = [
  { icon: Disc3,    title: 'Fren Sistemi',     blurb: 'Disk, balata, kaliper' },
  { icon: Lightbulb,title: 'Aydınlatma',       blurb: 'Far, sis, sinyal' },
  { icon: Battery,  title: 'Akü & Elektrik',   blurb: 'Akü, marş, alternatör' },
  { icon: Wrench,   title: 'Süspansiyon',      blurb: 'Amortisör, salıncak' },
  { icon: Wind,     title: 'Klima & Soğutma',  blurb: 'Radyatör, kompresör' },
  { icon: Cog,      title: 'Motor Parçaları',  blurb: 'Triger, kayış, conta' },
  { icon: Filter,   title: 'Filtreler',        blurb: 'Yağ, hava, polen, yakıt' },
  { icon: Package,  title: 'Diğer Parçalar',   blurb: 'Kaporta, donanım' },
]

export default function Categories() {
  return (
    <section className="bg-gray-50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-12 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-600">
              Popüler Kategoriler
            </p>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
              En çok aranan parça grupları
            </h2>
          </div>
          <Link
            href="/parcalar"
            className="text-sm font-semibold text-gray-600 underline-offset-4 hover:text-primary-600 hover:underline"
          >
            Tüm kategoriler →
          </Link>
        </header>

        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATEGORIES.map(({ icon: Icon, title, blurb }) => (
            <li key={title}>
              <Link
                href="/parcalar"
                className="group flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-500 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">{title}</div>
                  <div className="mt-0.5 text-xs text-gray-500">{blurb}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
