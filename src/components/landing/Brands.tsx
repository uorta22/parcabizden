'use client'

/**
 * Brands — statik marka logosu grid (marquee yok).
 *
 * Tasarım kararları:
 *  • Marquee = okuma akışını bozar, profesyonelliği zayıflatır.
 *  • Static grid: kullanıcı taradığı markayı görür, hover ile vurgulanır.
 *  • 6 sütun (desktop) → 3 (mobile). Tek satırda 12 marka kafidir.
 */

import { useState } from 'react'
import Link from 'next/link'

const BRANDS = [
  ['volkswagen', 'Volkswagen'],
  ['bmw',        'BMW'],
  ['mercedes-benz', 'Mercedes-Benz'],
  ['audi',       'Audi'],
  ['toyota',     'Toyota'],
  ['ford',       'Ford'],
  ['opel',       'Opel'],
  ['renault',    'Renault'],
  ['peugeot',    'Peugeot'],
  ['citroen',    'Citroën'],
  ['fiat',       'Fiat'],
  ['skoda',      'Škoda'],
  ['seat',       'SEAT'],
  ['volvo',      'Volvo'],
  ['hyundai',    'Hyundai'],
  ['kia',        'Kia'],
  ['mazda',      'Mazda'],
  ['nissan',     'Nissan'],
] as const

function LogoTile({ slug, name }: { slug: string; name: string }) {
  const [err, setErr] = useState(false)
  return (
    <Link
      href="/parcalar"
      className="group flex h-20 items-center justify-center rounded-xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm"
    >
      {err ? (
        <span className="text-xs font-semibold text-gray-500">{name}</span>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`/brands/${slug}.webp`}
          alt={name}
          className="max-h-9 max-w-[80%] object-contain opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
          loading="lazy"
          onError={() => setErr(true)}
        />
      )}
    </Link>
  )
}

export default function Brands() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-600">
              Desteklenen Markalar
            </p>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
              Popüler markalar, tek platform
            </h2>
          </div>
          <Link
            href="/parcalar"
            className="text-sm font-semibold text-gray-600 underline-offset-4 hover:text-primary-600 hover:underline"
          >
            Tümünü gör →
          </Link>
        </header>

        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {BRANDS.map(([slug, name]) => (
            <li key={slug}>
              <LogoTile slug={slug} name={name} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
