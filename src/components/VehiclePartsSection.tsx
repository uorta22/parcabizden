/**
 * VehiclePartsSection — Vehicle Hub'da "Yedek Parçalar" grid'i.
 *
 * Otoparcasan tarzı: 6 ana grup kartı, her grubun içinde görselli
 * alt kategori öğeleri (Lucide ikon + isim). Tıklayınca o kategorinin
 * parça listesine düşer (/parcalar?vehicle=KType&q=<slug>).
 *
 * Bu yapı vehicle-aware: KType URL'e dahil olduğu için parcalar
 * sayfasında auto-select logic devreye girer ve kullanıcı direkt
 * parça listesini görür.
 */

import Link from 'next/link'
import {
  Disc3, CircleDot, Wrench, Cog, Gauge, Filter as FilterIcon,
  Battery, Lightbulb, Zap, ZapOff, Car as CarIcon, Wind,
  Settings2, Hammer, Snowflake, Fuel, Activity, Layers,
  Box, ArrowRight, AirVent,
} from 'lucide-react'

const ACCENT = '#ff7a1a'

type SubItem = { label: string; icon: typeof Disc3 }
type Group = {
  id: string
  title: string
  icon: typeof Disc3
  items: SubItem[]
}

const GROUPS: Group[] = [
  {
    id: 'fren-debriyaj',
    title: 'Fren ve Debriyaj',
    icon: Disc3,
    items: [
      { label: 'ABS Sensörü',     icon: Activity },
      { label: 'Fren Disk Ayna',  icon: Disc3 },
      { label: 'Fren Disk Balata', icon: CircleDot },
      { label: 'Fren Pabuçlu Balata', icon: CircleDot },
      { label: 'Debriyaj Rulmanı', icon: Cog },
      { label: 'Debriyaj Seti',    icon: Layers },
    ],
  },
  {
    id: 'motor-yakit',
    title: 'Motor ve Yakıt',
    icon: Cog,
    items: [
      { label: 'Motor Takozu',     icon: Box },
      { label: 'Triger Kayışı',    icon: Layers },
      { label: 'Turbo Şarj',       icon: Wind },
      { label: 'Depo Şamandırası', icon: Fuel },
      { label: 'Hava Debimetresi', icon: Gauge },
      { label: 'Oksijen Sensörü',  icon: Activity },
    ],
  },
  {
    id: 'suspansiyon-direksiyon',
    title: 'Süspansiyon ve Direksiyon',
    icon: Wrench,
    items: [
      { label: 'Aks Komple',       icon: Settings2 },
      { label: 'Amortisör',        icon: Activity },
      { label: 'Teker Rulmanı',    icon: CircleDot },
      { label: 'Rot Başı',         icon: Wrench },
      { label: 'Salıncak',         icon: Layers },
      { label: 'Direksiyon Pompası', icon: Cog },
    ],
  },
  {
    id: 'elektrik-aydinlatma',
    title: 'Elektrik ve Aydınlatma',
    icon: Zap,
    items: [
      { label: 'Akü',              icon: Battery },
      { label: 'Ateşleme Bobini',  icon: Zap },
      { label: 'Ateşleme Bujisi',  icon: ZapOff },
      { label: 'Cam Açma Düğmesi', icon: Box },
      { label: 'Far Lambası',      icon: Lightbulb },
      { label: 'Stop Lambası',     icon: Lightbulb },
    ],
  },
  {
    id: 'kaporta-trim',
    title: 'Kaporta ve Trim',
    icon: CarIcon,
    items: [
      { label: 'Dikiz Aynası',     icon: CarIcon },
      { label: 'Kapı Gergisi',     icon: Wrench },
      { label: 'Kapı Kilidi',      icon: Hammer },
      { label: 'Silecek Süpürgesi', icon: AirVent },
      { label: 'Tampon',           icon: Box },
      { label: 'Çamurluk Davlumbazı', icon: CarIcon },
    ],
  },
  {
    id: 'sanziman-diferansiyel',
    title: 'Şanzıman ve Diferansiyel',
    icon: Cog,
    items: [
      { label: 'Kilometre Hız Sensörü', icon: Gauge },
      { label: 'Şaft Askısı Takozu',    icon: Box },
      { label: 'Şanzıman Takozu',       icon: Cog },
      { label: 'Vites Değiştirme Teli', icon: Layers },
      { label: 'Vites Topuzu',          icon: Settings2 },
      { label: 'Mafsal İstavrozu',      icon: Hammer },
    ],
  },
]

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function VehiclePartsSection({ vehicleId }: { vehicleId: number }) {
  return (
    <section className="mt-6">
      <h2 className="mb-4 text-base font-bold text-gray-900 md:text-lg">Yedek Parçalar</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map(g => (
          <GroupCard key={g.id} group={g} vehicleId={vehicleId} />
        ))}
      </div>
    </section>
  )
}

function GroupCard({ group, vehicleId }: { group: Group; vehicleId: number }) {
  const GroupIcon = group.icon
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5">
      <header className="mb-4 flex items-center gap-2.5 border-b border-gray-100 pb-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md"
          style={{ background: `${ACCENT}15`, color: ACCENT }}
        >
          <GroupIcon className="h-4 w-4" strokeWidth={2.2} />
        </div>
        <h3 className="font-bold" style={{ color: ACCENT }}>{group.title}</h3>
      </header>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3">
        {group.items.map(it => {
          const Icon = it.icon
          return (
            <li key={it.label}>
              <Link
                href={`/parcalar?vehicle=${vehicleId}&q=${slugify(it.label)}`}
                className="group flex flex-col items-center gap-1.5 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-50 text-gray-500 transition-colors group-hover:bg-[#ff7a1a]/10 group-hover:text-[#ff7a1a]">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <span className="text-[11px] font-semibold leading-tight text-gray-700 transition-colors group-hover:text-[#ff7a1a]">
                  {it.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      <Link
        href={`/parcalar?vehicle=${vehicleId}&group=${group.id}`}
        className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-gray-50 py-2.5 text-xs font-semibold transition-colors hover:bg-gray-100"
        style={{ color: ACCENT }}
      >
        Tüm <span className="lowercase">{group.title}</span> Ürünlerini İncele
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  )
}
