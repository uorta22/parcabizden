'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Phone, ArrowRight, Sparkles } from 'lucide-react'
import { getWhatsAppUrl, getPhoneUrl, siteConfig } from '@/lib/config'

export default function CtaBannerSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className={`relative max-w-4xl mx-auto rounded-3xl overflow-hidden transition-all duration-700 ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f1628 0%, #1a2652 100%)' }} />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(rgba(249,172,27,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(249,172,27,0.5) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #f9ac1b, transparent 70%)' }} />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #3c4f82, transparent 70%)' }} />
          </div>

          <div className="relative p-10 md:p-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase border mb-8"
              style={{ background: 'rgba(249,172,27,0.12)', borderColor: 'rgba(249,172,27,0.3)', color: '#f9ac1b' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
              Şimdi Başlayın
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
              Aradığınız Parçayı
              <br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #f9ac1b, #fcd48c)' }}>
                Birlikte Bulalım
              </span>
            </h2>

            <p className="text-white/50 text-base md:text-lg mb-10 max-w-lg mx-auto">
              Katalogda bulamadığınız parçalar için uzman ekibimiz 7/24 WhatsApp&apos;ta hazır. Ortalama yanıt süresi 2 dakika.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={getWhatsAppUrl(siteConfig.whatsapp.notFoundMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(34,197,94,0.4)] active:scale-95"
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp ile Sor
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href={getPhoneUrl()}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-white border border-white/20 hover:bg-white/10 transition-all"
              >
                <Phone className="w-5 h-5" />
                {siteConfig.phone.display}
              </a>

              <Link
                href="/ai-asistan"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold transition-all border"
                style={{ background: 'rgba(147,51,234,0.2)', borderColor: 'rgba(147,51,234,0.4)', color: '#c084fc' }}
              >
                <Sparkles className="w-5 h-5" />
                AI Asistan
              </Link>
            </div>

            <div className="flex justify-center items-center gap-8 mt-10 pt-8 border-t border-white/10">
              {['Kalite Garantisi', 'Hızlı Teslimat', 'Uzman Destek'].map((label) => (
                <div key={label} className="flex items-center gap-2 text-white/30 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
