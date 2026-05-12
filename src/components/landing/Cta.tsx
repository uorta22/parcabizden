/**
 * Aradığınız parçayı bulamadınız mı? — banner tarzı CTA.
 * Otoparcasan'daki "Anlaşmalı Servisler / Bakım Robotu" bantları
 * stilinde: yan yana 2 destek bandı (telefon + WhatsApp), accent çubuk.
 */

import { Phone, MessageCircle, Headphones } from 'lucide-react'
import { getWhatsAppUrl, siteConfig } from '@/lib/config'

const ACCENT = '#ff7a1a'

export default function Cta() {
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* Üst accent çubuk */}
          <div className="h-1" style={{ background: ACCENT }} />

          <div className="grid divide-y divide-gray-200 md:grid-cols-3 md:divide-x md:divide-y-0">
            {/* Sol: başlık */}
            <div className="flex items-center gap-4 p-6 md:col-span-1">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${ACCENT}15`, color: ACCENT }}
              >
                <Headphones className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight text-gray-900">
                  Aradığınız parçayı bulamadınız mı?
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Uzman ekibimiz size yardımcı olsun
                </p>
              </div>
            </div>

            {/* Telefon */}
            <a
              href={`tel:${siteConfig.phone.raw}`}
              className="flex items-center gap-4 p-6 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Phone className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500">Hemen Arayın</div>
                <div className="text-base font-bold text-gray-900">{siteConfig.phone.display}</div>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href={getWhatsAppUrl(siteConfig.whatsapp.notFoundMessage)}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 p-6 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <MessageCircle className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500">WhatsApp Destek</div>
                <div className="text-base font-bold text-gray-900">Anında yanıt al</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
