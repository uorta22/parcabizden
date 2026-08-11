/**
 * How It Works — sade 3 adımlı süreç.
 * Hero ile aynı beyaz tema, accent renk #ff7a1a.
 */

import { Search, Store, CheckCircle2 } from 'lucide-react'

const ACCENT = '#ff7a1a'

const STEPS = [
  { n: '01', icon: Search,       title: 'Talebini oluştur',              body: 'Aracını ve ihtiyacın olan parçayı birkaç adımda tanımla, üyelik gerekmez.' },
  { n: '02', icon: Store,        title: 'Doğrulanmış satıcılar teklif gönderir', body: 'Uygun satıcılar talebini görür, sana fiyat ve stok bilgisiyle teklif iletir.' },
  { n: '03', icon: CheckCircle2, title: 'Teklifleri karşılaştır',        body: 'Gelen teklifleri fiyat ve satıcıya göre karşılaştırıp sana en uygun olanı seç.' },
]

export default function HowItWorks() {
  return (
    <section className="border-t border-gray-200 bg-gray-50 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-8 text-center md:mb-10">
          <h2 className="text-xl font-bold text-gray-900 md:text-2xl">Nasıl Çalışır?</h2>
          <p className="mt-1 text-sm text-gray-500">Üç adımda aracınıza uygun parçaya ulaşın</p>
        </header>

        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ n, icon: Icon, title, body }) => (
            <li key={n} className="relative rounded-xl border border-gray-200 bg-white p-6">
              <span
                className="absolute right-4 top-4 text-2xl font-bold tabular-nums opacity-20"
                style={{ color: ACCENT }}
              >
                {n}
              </span>
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg"
                style={{ background: `${ACCENT}15`, color: ACCENT }}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <h3 className="mb-1.5 font-bold text-gray-900">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
