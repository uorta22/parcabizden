/**
 * Final CTA — tek odak: WhatsApp'a düş.
 *
 * Tasarım kararları:
 *  • 3 buton yerine tek primary + ikincil link.
 *  • Dark anchor: hero ile rezonans.
 *  • Border accent (üstte yellow line) — minimal vurgular.
 */

import { MessageCircle, ArrowRight } from 'lucide-react'
import { getWhatsAppUrl, siteConfig } from '@/lib/config'

export default function Cta() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-4">
        <div className="relative overflow-hidden rounded-3xl bg-[#0b1120] p-10 md:p-16">
          {/* Üst aksent çizgisi */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent" />
          {/* Subtle radial highlight */}
          <div
            aria-hidden
            className="absolute -right-32 -top-32 h-80 w-80 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #f9ac1b, transparent 70%)' }}
          />

          <div className="relative grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-black leading-tight tracking-tight text-white md:text-4xl">
                Aradığınız parçayı bulamadınız mı?
              </h2>
              <p className="mt-4 text-base text-white/60">
                Kataloğa düşmeyen, emin olmadığınız veya özel bir parça mı arıyorsunuz?
                Uzman ekibimiz birlikte bulalım.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <a
                href={getWhatsAppUrl(siteConfig.whatsapp.notFoundMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-[#22c55e] px-7 py-4 font-bold text-white transition-all hover:bg-[#16a34a] hover:shadow-lg active:scale-[0.98]"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp ile sor
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href={`tel:${siteConfig.phone.raw}`}
                className="text-sm text-white/50 transition-colors hover:text-white"
              >
                veya {siteConfig.phone.display}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
