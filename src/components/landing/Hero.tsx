'use client'

/**
 * Hero — autodoc tarzı: araç seçici primary, VIN/OEM secondary.
 *
 * Tasarım kararları:
 *  • Asıl CTA: Marka → Model → Varyant zinciri (autodoc'un kalbi)
 *  • İkincil seçenek: VIN veya OEM ile direkt (alternatif kullanım)
 *  • Tab değişimi snap'li, animasyon yok
 *  • Tek navy gradient zemin, sade grid pattern
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, Car, Hash, FileSearch } from 'lucide-react'
import VehicleFinder from './VehicleFinder'

type Tab = 'vehicle' | 'vin' | 'oem'

export default function Hero() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('vehicle')
  const [vin, setVin] = useState('')
  const [oem, setOem] = useState('')
  const [err, setErr] = useState('')

  const submitVin = useCallback(() => {
    const v = vin.trim().toUpperCase()
    if (v.length !== 17) { setErr('VIN tam olarak 17 karakter olmalı'); return }
    setErr(''); router.push(`/?vin=${v}#arama`)
  }, [vin, router])

  const submitOem = useCallback(() => {
    const q = oem.trim()
    if (q.length < 3) { setErr('En az 3 karakter girin'); return }
    setErr(''); router.push(`/parca/${encodeURIComponent(q)}`)
  }, [oem, router])

  return (
    <section className="relative isolate overflow-hidden bg-[#0b1120] text-white">
      {/* Decorative: subtle grid + corner glow */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      <div
        aria-hidden
        className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #f9ac1b 0%, transparent 65%)' }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-28 pb-20 md:pt-36 md:pb-28">
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
          Marka, model ve varyantınızı seçin — TecDoc kataloğundan birebir uyumlu yedek ve çıkma parçaları listeleyelim.
        </p>

        {/* Search panel */}
        <div className="mx-auto mt-10 max-w-4xl">
          {/* Tabs */}
          <div className="flex gap-1 px-1">
            {([
              ['vehicle', 'Araç ile bul', Car] as const,
              ['vin',     'VIN ile',       FileSearch] as const,
              ['oem',     'OEM ile',       Hash] as const,
            ]).map(([key, label, Icon]) => {
              const active = tab === key
              return (
                <button
                  key={key}
                  onClick={() => { setTab(key); setErr('') }}
                  className={`flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-semibold transition-all ${
                    active
                      ? 'bg-white/[0.04] text-white border-x border-t border-white/10'
                      : 'text-white/45 hover:text-white/70'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              )
            })}
          </div>

          {/* Tab body */}
          {tab === 'vehicle' && <VehicleFinder />}

          {tab === 'vin' && (
            <SecondarySearchCard>
              <div className="flex items-center gap-3 p-3">
                <Search className="ml-2 h-5 w-5 flex-shrink-0 text-white/40" />
                <input
                  type="text"
                  value={vin}
                  onChange={e => { setVin(e.target.value.toUpperCase()); setErr('') }}
                  onKeyDown={e => e.key === 'Enter' && submitVin()}
                  placeholder="WVWZZZ1JZ3W386752"
                  maxLength={17}
                  className="flex-1 bg-transparent py-2 font-mono text-sm tracking-widest text-white outline-none placeholder:text-white/25"
                />
                <span className="hidden text-[11px] tabular-nums text-white/30 sm:block">{vin.length}/17</span>
                <SubmitButton onClick={submitVin}>VIN ile Ara</SubmitButton>
              </div>
              <p className="px-4 pb-3 text-[11px] text-white/30">
                VIN: ruhsatta, ön cam sol köşesinde veya kapı çerçevesinde bulunur.
              </p>
            </SecondarySearchCard>
          )}

          {tab === 'oem' && (
            <SecondarySearchCard>
              <div className="flex items-center gap-3 p-3">
                <Search className="ml-2 h-5 w-5 flex-shrink-0 text-white/40" />
                <input
                  type="text"
                  value={oem}
                  onChange={e => { setOem(e.target.value); setErr('') }}
                  onKeyDown={e => e.key === 'Enter' && submitOem()}
                  placeholder="Örn. 8E0407151"
                  className="flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/25"
                />
                <SubmitButton onClick={submitOem}>OEM ile Ara</SubmitButton>
              </div>
              <p className="px-4 pb-3 text-[11px] text-white/30">
                OEM numarasını parçanın etiketinde veya araç servis kataloğunda bulabilirsiniz.
              </p>
            </SecondarySearchCard>
          )}

          {err && <p className="mt-3 text-center text-xs text-red-400">{err}</p>}
        </div>

        {/* Trust strip */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-t border-white/10 pt-6 text-xs">
          {[
            ['10K+', 'parça çeşidi'],
            ['50+',  'araç markası'],
            ['7/24', 'WhatsApp destek'],
          ].map(([n, l]) => (
            <div key={l} className="flex items-baseline gap-2">
              <span className="text-base font-black tabular-nums text-white">{n}</span>
              <span className="text-white/40">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Helpers — VIN/OEM tab gövdeleri için ortak çerçeve
// ─────────────────────────────────────────────────────────
function SecondarySearchCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl rounded-tl-none border border-white/10 bg-white/[0.04] backdrop-blur-md"
      style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
    >
      {children}
    </div>
  )
}

function SubmitButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-shrink-0 items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-bold text-[#0b1120] transition-colors hover:bg-primary-400"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}
