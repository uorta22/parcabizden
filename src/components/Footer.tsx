/**
 * Footer — otoparcasan tarzı geniş 6 sütunlu yapı.
 *
 * Üst banner: logo + destek hatları
 * 6 kolon: Kurumsal / Hızlı Erişim / Markalar / Araçlar / Modeller / Kategoriler
 * Alt bant: copyright + kampanya notu (turuncu zemin)
 */

import Link from 'next/link'
import { Phone, MessageCircle } from 'lucide-react'
import { siteConfig, getWhatsAppUrl } from '@/lib/config'
import { LogoWordmark } from './Logo'

const ACCENT = '#ff7a1a'

const KURUMSAL = [
  { label: 'Çerez Ayarları',         href: '/gizlilik' },
  { label: 'Çerez Politikası',       href: '/gizlilik' },
  { label: 'Garanti ve İade',        href: '/kullanim-sartlari' },
  { label: 'Gizlilik Politikası',    href: '/gizlilik' },
  { label: 'Hakkımızda',             href: '/hakkimizda' },
  { label: 'İletişim & Künye',       href: '/iletisim' },
  { label: 'Kullanım Şartları',      href: '/kullanim-sartlari' },
  { label: 'Site Haritası',          href: '/sitemap.xml' },
]

const HIZLI_ERISIM = [
  { label: 'Anlaşmalı Servisler',    href: '/iletisim' },
  { label: 'Ürün Kataloğu',          href: '/parcalar' },
  { label: 'Bakım Robotu',           href: '/hesabim/garaj' },
  { label: 'Garajım',                href: '/hesabim/garaj' },
  { label: 'Şasi Sorgulama',         href: '/' },
  { label: 'Sıkça Sorulan Sorular',  href: '/iletisim' },
  { label: 'Kargo ve Teslimat',      href: '/kullanim-sartlari' },
]

const MARKALAR = ['Bosch', 'Delphi', 'Febi Bilstein', 'Filtron', 'Gates', 'Hella',
                  'Magneti Marelli', 'Mahle', 'Sachs', 'Valeo']

const ARACLAR = [
  ['Audi',         121], ['BMW',  16], ['Fiat',  35], ['Ford',  36],
  ['Honda',        45],  ['Hyundai', 183], ['Mercedes-Benz', 74], ['Opel', 84],
  ['Peugeot',      88],  ['Renault', 93],  ['Toyota', 111], ['Volkswagen', 121],
] as const

const MODELLER = ['Audi A3', 'BMW 3 Serisi', 'Fiat Egea', 'Ford Focus', 'Honda Civic',
                  'Hyundai i20', 'Mercedes C Serisi', 'Opel Astra', 'Peugeot 2008',
                  'Renault Clio', 'Toyota Corolla', 'VW Passat']

const KATEGORILER = ['ABS Sensörü', 'Amortisör', 'Ateşleme Bujisi', 'Debriyaj Seti',
                     'Far Lambası', 'Fren Diski', 'Fren Balatası', 'Hava Filtresi',
                     'Klima Kompresörü', 'Motor Yağı', 'Polen Filtresi', 'Triger Zincir Seti']

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      {/* Üst banner: logo + destek */}
      <div className="border-b border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-6">
            <Link href="/" className="inline-block" aria-label="ParçaBizden — Anasayfa">
              <LogoWordmark size={0.7} />
            </Link>
            <p className="max-w-2xl text-center text-sm text-gray-500">
              <strong className="text-gray-700">ParçaBizden</strong> aracınıza birebir uyumlu yedek parçaları TecDoc kataloğu üzerinden hızlı ve güvenilir şekilde sunan online satış platformudur.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={`tel:${siteConfig.phone.raw}`}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-300"
              >
                <Phone className="h-4 w-4 text-sky-500" />
                <span className="text-gray-500">DESTEK</span>
                <span>{siteConfig.phone.display}</span>
              </a>
              <a
                href={getWhatsAppUrl('Merhaba, bilgi almak istiyorum.')}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-300"
              >
                <MessageCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-gray-500">WHATSAPP</span>
                <span>{siteConfig.phone.display}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Ana sütunlar */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-6">
          <Column title="Kurumsal"     items={KURUMSAL} />
          <Column title="Hızlı Erişim" items={HIZLI_ERISIM} />

          <ListCol title="Popüler Markalar">
            <li><Link href="/parcalar" className={linkCls}>Tüm Markalar</Link></li>
            {MARKALAR.map(m => (
              <li key={m}>
                <Link href={`/parcalar?q=${slugify(m)}`} className={linkCls}>{m} Yedek Parça</Link>
              </li>
            ))}
          </ListCol>

          <ListCol title="Popüler Araçlar">
            <li><Link href="/parcalar" className={linkCls}>Tüm Araçlar</Link></li>
            {ARACLAR.map(([name, brandId]) => (
              <li key={name}>
                <Link href={`/parcalar?brand=${brandId}`} className={linkCls}>{name} Yedek Parça</Link>
              </li>
            ))}
          </ListCol>

          <ListCol title="Popüler Modeller">
            <li><Link href="/parcalar" className={linkCls}>Tüm Modeller</Link></li>
            {MODELLER.map(m => (
              <li key={m}>
                <Link href={`/parcalar?q=${slugify(m)}`} className={linkCls}>{m} Yedek Parça</Link>
              </li>
            ))}
          </ListCol>

          <ListCol title="Popüler Kategoriler">
            <li><Link href="/parcalar" className={linkCls}>Tüm Kategoriler</Link></li>
            {KATEGORILER.map(k => (
              <li key={k}>
                <Link href={`/parcalar?q=${slugify(k)}`} className={linkCls}>{k}</Link>
              </li>
            ))}
          </ListCol>
        </div>
      </div>

      {/* Alt bant — accent */}
      <div className="py-3" style={{ background: ACCENT }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-center text-xs text-white sm:flex-row">
          <p>© {new Date().getFullYear()} ParçaBizden — Tüm hakları saklıdır.</p>
          <p className="font-semibold uppercase tracking-wider">
            7500₺ ve üzeri 2 taksitli alışverişlerde %0 komisyon
          </p>
        </div>
      </div>
    </footer>
  )
}

const linkCls = 'text-xs text-gray-600 hover:text-[#ff7a1a]'

function Column({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <ListCol title={title}>
      {items.map(it => (
        <li key={it.label}>
          <Link href={it.href} className={linkCls}>{it.label}</Link>
        </li>
      ))}
    </ListCol>
  )
}

function ListCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold text-gray-900">{title}</h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  )
}
