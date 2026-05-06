'use client'

/**
 * Hero — sade, endüstriyel, tek odak: arama.
 *
 * Tasarım kararları:
 *  • Karanlık navy zemin (ParcaBizden secondary-900) — endüstriyel ton
 *  • Tek headline + tek search card; ikinci CTA yok (decision fatigue)
 *  • Sabit grain pattern (animasyon değil); rasgele particle yok
 *  • Trust strip alta minimal, kanıt ışığında
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'

export default function Hero() {
  const router = useRouter()
  const [tab, setTab] = useState<'vin' | 'oem'>('vin')
  const [vin, setVin] = useState('')
  const [oem, setOem] = useState('')
  const [err, setErr] = useState('')

  const submit = useCallback(() => {
    if (tab === 'vin') {
      const v = vin.trim().toUpperCase()
      if (v.length !== 17) { setErr('VIN tam olarak 17 karakter olmalı'); return }
      setErr('')
      router.push(`/?vin=${v}#arama`)
    } else {
      const q = oem.trim()
      if (q.length < 3) { setErr('En az 3 karakter girin'); return }
      setErr('')
      router.push(`/parca/${encodeURIComponent(q)}`)
    }
  }, [tab, vin, oem, router])

  return (
    <section className="relative isolate overflow-hidden bg-[#0b1120] text-white">
      {/* Dekoratif: grid + tek diagonal aksent. Hareket yok. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />
      <div
        aria-hidden
        className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #f9ac1b 0%, transparent 65%)' }}
      />

      <div className="relative mx-auto max-w-5xl px-4 pt-32 pb-24 md:pt-40 md:pb-32">
        {/* Eyebrow */}
        <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-400">
          Türkiye&apos;nin Akıllı Parça Platformu
        </p>

        {/* Headline */}
        <h1 className="mx-auto max-w-3xl text-center text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
          Aracınıza özel parçayı
          <br />
          <span className="text-primary-500">saniyeler</span> içinde bulun
        </h1>

        {/* Subhead */}
        <p className="mx-auto mt-5 max-w-xl text-center text-base text-white/60 md:text-lg">
          Şase numaranızı veya OEM kodunu girin — TecDoc kataloğunda araca birebir uyumlu yedek ve çıkma parçaları listeleyelim.
        </p>

        {/* Search card */}
        <div className="mx-auto mt-10 max-w-2xl">
          <div
            className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md"
            style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
          >
            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {(['vin', 'oem'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setErr('') }}
                  className={`flex-1 px-5 py-3.5 text-sm font-semibold transition-colors ${
                    tab === t ? 'bg-white/[0.06] text-white' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {t === 'vin' ? 'Şase (VIN) ile' : 'OEM Numarası ile'}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-3 p-3">
              <Search className="ml-2 h-5 w-5 flex-shrink-0 text-white/40" />
              {tab === 'vin' ? (
                <input
                  type="text"
                  value={vin}
                  onChange={e => { setVin(e.target.value.toUpperCase()); setErr('') }}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="WVWZZZ1JZ3W386752"
                  maxLength={17}
                  className="flex-1 bg-transparent py-2 font-mono text-sm tracking-widest outline-none placeholder:text-white/25"
                />
              ) : (
                <input
                  type="text"
                  value={oem}
                  onChange={e => { setOem(e.target.value); setErr('') }}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="Örn. 8E0407151"
                  className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-white/25"
                />
              )}
              <span className="hidden text-[11px] tabular-nums text-white/30 sm:block">
                {tab === 'vin' ? `${vin.length}/17` : ''}
              </span>
              <button
                onClick={submit}
                className="group flex flex-shrink-0 items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-bold text-[#0b1120] transition-colors hover:bg-primary-400"
              >
                Ara
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          {err && <p className="mt-3 text-center text-xs text-red-400">{err}</p>}

          <p className="mt-3 text-center text-[11px] text-white/30">
            VIN: ruhsatta, ön cam sol köşesinde veya kapı çerçevesinde bulunur.
          </p>
        </div>

        {/* Trust strip */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-t border-white/10 pt-6 text-xs">
          {[
            ['10K+', 'parça çeşidi'],
            ['50+',  'araç markası'],
            ['7/24', 'WhatsApp destek'],
          ].map(([n, l]) => (
            <div key={l as string} className="flex items-baseline gap-2">
              <span className="text-base font-black tabular-nums text-white">{n}</span>
              <span className="text-white/40">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
