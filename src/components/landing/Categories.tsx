/**
 * Categories — autodoc tarzı geniş katalog grid.
 *
 * 16 popüler parça grubu. Hover ile primary'e dönüşen ikon kartı.
 * Tıklayınca /parcalar sayfasına geçer (TecDoc browse akışı).
 */

import Link from 'next/link'
import {
  Disc3, Lightbulb, Battery, Wrench, Wind, Cog, Filter, Package,
  Zap, Fuel, Gauge, Settings2, Snowflake, Car, Wifi, Hammer,
} from 'lucide-react'

const CATEGORIES = [
  { icon: Disc3,     title: 'Fren Sistemi',     blurb: 'Disk, balata, kaliper' },
  { icon: Cog,       title: 'Motor',            blurb: 'Triger, kayış, conta' },
  { icon: Wrench,    title: 'Süspansiyon',      blurb: 'Amortisör, salıncak' },
  { icon: Filter,    title: 'Filtreler',        blurb: 'Yağ, hava, polen, yakıt' },
  { icon: Lightbulb, title: 'Aydınlatma',       blurb: 'Far, sis, sinyal' },
  { icon: Battery,   title: 'Akü & Elektrik',   blurb: 'Akü, marş, alternatör' },
  { icon: Wind,      title: 'Klima & Soğutma',  blurb: 'Radyatör, kompresör' },
  { icon: Zap,       title: 'Ateşleme',         blurb: 'Buji, bobin, kablolar' },
  { icon: Fuel,      title: 'Yakıt Sistemi',    blurb: 'Pompa, enjektör' },
  { icon: Settings2, title: 'Direksiyon',       blurb: 'Rot, rotbaşı, mil' },
  { icon: Gauge,     title: 'Egzoz',            blurb: 'Susturucu, katalizör' },
  { icon: Snowflake, title: 'Soğutma Sıvısı',   blurb: 'Antifriz, sensörler' },
  { icon: Car,       title: 'Kaporta',          blurb: 'Tampon, kaput, çamurluk' },
  { icon: Hammer,    title: 'İç Mekan',         blurb: 'Koltuk, kapı kolu' },
  { icon: Wifi,      title: 'Sensörler',        blurb: 'ABS, ESP, lambda' },
  { icon: Package,   title: 'Diğer Parçalar',   blurb: 'Donanım, küçük parça' },
]

export default function Categories() {
  return (
    <section className="bg-gray-50 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-600">
              Tüm Kategoriler
            </p>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
              Parça grubuna göre göz atın
            </h2>
          </div>
          <Link
            href="/parcalar"
            className="text-sm font-semibold text-gray-600 underline-offset-4 hover:text-primary-600 hover:underline"
          >
            Tüm kategoriler →
          </Link>
        </header>

        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 md:gap-3">
          {CATEGORIES.map(({ icon: Icon, title, blurb }) => (
            <li key={title}>
              <Link
                href="/parcalar"
                className="group flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md md:p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-500 group-hover:text-white">
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 md:text-base">{title}</div>
                  <div className="mt-0.5 text-[11px] text-gray-500 md:text-xs">{blurb}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
