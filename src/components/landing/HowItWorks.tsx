/**
 * How It Works — 3 sade kart, statik. Animasyon yok.
 *
 * Tasarım kararları:
 *  • İçerik > efekt: numaralı, soldan akan adımlar
 *  • Mobilde stack, masaüstünde 3 sütun
 *  • Connector çizgi sadece md+ ekranlarda
 */

import { Search, ListChecks, MessageCircle } from 'lucide-react'

const STEPS = [
  {
    n: '01',
    icon: Search,
    title: 'Aracınızı tanımlayın',
    body: 'Şase numarası, marka/model veya OEM kodu — hangisi sizin için kolaysa.',
  },
  {
    n: '02',
    icon: ListChecks,
    title: 'Uyumlu parçayı seçin',
    body: 'TecDoc kataloğundan aracınıza birebir uyan parçaları görün, kategoriye göre filtreleyin.',
  },
  {
    n: '03',
    icon: MessageCircle,
    title: 'Talep gönderin',
    body: 'Tek tıkla WhatsApp\'a düşer. Uzman ekibimiz fiyat ve stok bilgisini geri iletir.',
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-14 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-600">
            Nasıl Çalışır
          </p>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            Üç adımda doğru parça
          </h2>
        </header>

        <ol className="relative grid gap-6 md:grid-cols-3">
          {/* Connector çizgisi */}
          <div
            aria-hidden
            className="absolute left-0 top-7 hidden h-px w-full md:block"
            style={{ background: 'linear-gradient(90deg, transparent, #e5e7eb 15%, #e5e7eb 85%, transparent)' }}
          />

          {STEPS.map(({ n, icon: Icon, title, body }) => (
            <li key={n} className="relative bg-white">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-500 text-[#0b1120] shadow-sm ring-4 ring-white">
                  <Icon className="h-6 w-6" strokeWidth={2.4} />
                </span>
                <span className="text-2xl font-black tabular-nums text-gray-200">{n}</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
