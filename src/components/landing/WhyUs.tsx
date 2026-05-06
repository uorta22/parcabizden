/**
 * Why Us — sadece 3 anahtar değer önerisi. Bento grid yok.
 *
 * Tasarım kararları:
 *  • 8 özellik = tüketim aşırı yükü; 3'e indir, derinlik ekle.
 *  • Her kart: ikon + başlık + 1 cümle + kanıt (alt satır)
 *  • Alternatif zemin (gray-50 değil; navy slim accent)
 */

import { ShieldCheck, Zap, MessagesSquare } from 'lucide-react'

const REASONS = [
  {
    icon: ShieldCheck,
    title: 'Birebir uyumluluk',
    body: 'Şase numarasından motor koduna kadar tüm değişkenler — yanlış parça yok.',
    proof: 'TecDoc kataloğu üzerinden ID bazlı doğrulama',
  },
  {
    icon: Zap,
    title: 'Hızlı sonuç',
    body: 'VIN girişinden parça listesine 5 saniye. Karmaşık sorgu yok.',
    proof: 'Ortalama yanıt süresi 2 dakika WhatsApp\'ta',
  },
  {
    icon: MessagesSquare,
    title: 'Uzman desteği',
    body: 'Kataloğa düşmeyen veya emin olmadığınız parçalar için 7/24 hat.',
    proof: 'Ürün spesifik soru → fotoğraflı yönlendirme',
  },
]

export default function WhyUs() {
  return (
    <section className="bg-gray-50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-14 max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-600">
            Neden ParcaBizden
          </p>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            Doğru parçayı bulmak işin kolay tarafı olmalı
          </h2>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {REASONS.map(({ icon: Icon, title, body, proof }) => (
            <article
              key={title}
              className="rounded-2xl border border-gray-200 bg-white p-7 transition-all hover:border-gray-300 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b1120] text-primary-500">
                <Icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-gray-600">{body}</p>
              <p className="border-t border-gray-100 pt-4 text-xs text-gray-400">{proof}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
