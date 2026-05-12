/**
 * Categories — 5 ana grup, her grup görsel ikon + accent tonu.
 *
 * Otoparcasan tarzı görsel kategori grid'i:
 *  • Sol üst: turuncu ikon kutusu
 *  • Sağ: başlık + alt kategori chip'leri
 *  • Hover: kart hafif lift + accent border
 *
 * Alt chip tıklayınca /parcalar?cat=<id>'a gider (Faz 4.3'te
 * gerçek catalog_categories.id eşlemesi yapılacak).
 */

import Link from 'next/link'
import {
  Disc3, Cog, Wrench, Zap, Car as CarIcon,
} from 'lucide-react'

const ACCENT = '#ff7a1a'

type Group = {
  icon: typeof Disc3
  title: string
  items: { label: string }[]
}

const GROUPS: Group[] = [
  {
    icon: Disc3,
    title: 'Fren ve Debriyaj',
    items: [
      { label: 'Fren Diski' }, { label: 'Fren Balatası' }, { label: 'Fren Kaliperi' },
      { label: 'Fren Hortumları' }, { label: 'Debriyaj Seti' }, { label: 'Debriyaj Pompası' },
    ],
  },
  {
    icon: Cog,
    title: 'Motor ve Yakıt',
    items: [
      { label: 'Triger Kayışı' }, { label: 'Conta Setleri' }, { label: 'Yağ Filtresi' },
      { label: 'Yakıt Filtresi' }, { label: 'Hava Filtresi' }, { label: 'Buji ve Bobin' },
    ],
  },
  {
    icon: Wrench,
    title: 'Süspansiyon ve Direksiyon',
    items: [
      { label: 'Amortisör' }, { label: 'Yay (Helezon)' }, { label: 'Salıncak Takımı' },
      { label: 'Rotil ve Rot' }, { label: 'Tekerlek Yatağı' }, { label: 'Direksiyon Mili' },
    ],
  },
  {
    icon: Zap,
    title: 'Elektrik ve Aydınlatma',
    items: [
      { label: 'Akü' }, { label: 'Marş Motoru' }, { label: 'Alternatör' },
      { label: 'Far ve Sis' }, { label: 'Ampul ve LED' }, { label: 'ABS / ESP Sensörleri' },
    ],
  },
  {
    icon: CarIcon,
    title: 'Kaporta ve Trim',
    items: [
      { label: 'Tampon ve Izgara' }, { label: 'Çamurluk' }, { label: 'Kaput' },
      { label: 'Ayna ve Cam' }, { label: 'Silecek Sistemi' }, { label: 'Diğer Donanım' },
    ],
  },
]

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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
            href="/parcalar"
            className="text-sm font-semibold underline-offset-4 hover:underline"
            style={{ color: ACCENT }}
          >
            Tümünü gör →
          </Link>
        </header>

        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map(({ icon: Icon, title, items }) => (
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
                    <li key={it.label}>
                      <Link
                        href={`/parcalar?q=${encodeURIComponent(slugify(it.label))}`}
                        className="inline-block rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition-colors hover:border-[#ff7a1a]/50 hover:text-[#ff7a1a]"
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
