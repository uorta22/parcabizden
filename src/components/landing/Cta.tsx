/**
 * Final CTA — sade beyaz kart, tek primary action.
 *
 * Önceki dark anchor kaldırıldı; otoparcasan/parcahane stilinde
 * temiz beyaz kutu içinde WhatsApp + telefon CTA'sı.
 */

import { MessageCircle, ArrowRight } from 'lucide-react'
import { getWhatsAppUrl, siteConfig } from '@/lib/config'

const ACCENT = '#ff7a1a'

export default function Cta() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center md:p-12">
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Aradığınız parçayı bulamadınız mı?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 md:text-base">
            Kataloğa düşmeyen veya emin olmadığınız parçalar için uzman ekibimiz WhatsApp'ta — ortalama yanıt süresi 2 dakika.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={getWhatsAppUrl(siteConfig.whatsapp.notFoundMessage)}
              target="_blank" rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-lg bg-[#22c55e] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#16a34a]"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp ile sor
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href={`tel:${siteConfig.phone.raw}`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-white"
              style={{ color: ACCENT, borderColor: '#ffd5b3' }}
            >
              {siteConfig.phone.display}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
