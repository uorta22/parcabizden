/**
 * Categories — autodoc tarzı ana parça grubu görünümü.
 *
 * 5 ana grup × her grupta 4-6 alt kategori.
 * Her grup: ikon + başlık + alt liste (chip'ler).
 * Alt grup tıklayınca /parcalar?cat=<id> ile filtreli sayfaya gider.
 *
 * NOT: Şu an alt kategoriler /parcalar'a generic deep-link veriyor;
 * gerçek catalog_categories.id eşleştirmesi Faz 4.3'te (legacy frontend
 * migration) tamamlanacak.
 */

import Link from 'next/link'
import {
  Disc3, Cog, Wrench, Zap, Car as CarIcon,
} from 'lucide-react'

type Group = {
  icon: typeof Disc3
  title: string
  accent: string
  items: { label: string; query?: string }[]
}

const GROUPS: Group[] = [
  {
    icon: Disc3,
    title: 'Fren ve Debriyaj',
    accent: '#dc2626',
    items: [
      { label: 'Fren Diski' },
      { label: 'Fren Balatası' },
      { label: 'Fren Kaliperi' },
      { label: 'Fren Hortumları' },
      { label: 'Debriyaj Seti' },
      { label: 'Debriyaj Pompası' },
    ],
  },
  {
    icon: Cog,
    title: 'Motor ve Yakıt',
    accent: '#0891b2',
    items: [
      { label: 'Triger Kayışı' },
      { label: 'Conta Setleri' },
      { label: 'Yağ Filtresi' },
      { label: 'Yakıt Filtresi' },
      { label: 'Hava Filtresi' },
      { label: 'Buji ve Bobin' },
    ],
  },
  {
    icon: Wrench,
    title: 'Süspansiyon ve Direksiyon',
    accent: '#7c3aed',
    items: [
      { label: 'Amortisör' },
      { label: 'Yay (Helezon)' },
      { label: 'Salıncak Takımı' },
      { label: 'Rotil ve Rot' },
      { label: 'Tekerlek Yatağı' },
      { label: 'Direksiyon Mili' },
    ],
  },
  {
    icon: Zap,
    title: 'Elektrik ve Aydınlatma',
    accent: '#f59e0b',
    items: [
      { label: 'Akü' },
      { label: 'Marş Motoru' },
      { label: 'Alternatör' },
      { label: 'Far ve Sis' },
      { label: 'Ampul ve LED' },
      { label: 'ABS / ESP Sensörleri' },
    ],
  },
  {
    icon: CarIcon,
    title: 'Kaporta ve Trim',
    accent: '#0ea5e9',
    items: [
      { label: 'Tampon ve Izgara' },
      { label: 'Çamurluk' },
      { label: 'Kaput' },
      { label: 'Ayna ve Cam' },
      { label: 'Silecek Sistemi' },
      { label: 'Diğer Donanım' },
    ],
  },
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
              Ana parça gruplarına göz atın
            </h2>
          </div>
          <Link
            href="/parcalar"
            className="text-sm font-semibold text-gray-600 underline-offset-4 hover:text-primary-600 hover:underline"
          >
            Tüm kategoriler →
          </Link>
        </header>

        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map(({ icon: Icon, title, accent, items }) => (
            <li key={title}>
              <article className="h-full rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-md">
                <header className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${accent}15`, color: accent }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <h3 className="font-bold text-gray-900">{title}</h3>
                </header>
                <ul className="flex flex-wrap gap-1.5">
                  {items.map(it => (
                    <li key={it.label}>
                      <Link
                        href={it.query ? `/parcalar?${it.query}` : '/parcalar'}
                        className="inline-block rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-white hover:text-primary-600"
                      >
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
