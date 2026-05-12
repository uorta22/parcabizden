'use client'

/**
 * Hero — otoparcasan / parcahane tarzı sade beyaz hero.
 *
 *  • Beyaz arka plan, dark tema yok
 *  • Tek bir minimal grid pattern (subtle)
 *  • Başlık + alt başlık + arama paneli + trust strip
 *  • 3 sekme: Araç ile bul (default), VIN, OEM
 *  • Animasyon yok — sadece hover state'ler
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, Car, Hash, FileSearch } from 'lucide-react'
import VehicleFinder from './VehicleFinder'

type Tab = 'vehicle' | 'vin' | 'oem'

const ACCENT = '#ff7a1a'

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
    <section className="relative border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 pt-12 pb-16 md:pt-16 md:pb-20">
        {/* Başlık bloğu */}
        <div className="mb-8 text-center md:mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
            Türkiye&apos;nin Akıllı Yedek Parça Platformu
          </p>
          <h1 className="mx-auto max-w-2xl text-2xl font-extrabold leading-tight text-gray-900 md:text-4xl">
            Aracınıza özel yedek parçayı
            <br className="hidden sm:block" />
            <span style={{ color: ACCENT }}> saniyeler</span> içinde bulun
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 md:text-base">
            Marka, model ve varyantınızı seçin aracınıza birebir uyumlu parçaları listeleyelin.
          </p>
        </div>

        {/* Search panel */}
        <div className="mx-auto max-w-3xl">
          {/* Sekmeler */}
          <div className="flex gap-1 border-b border-gray-200">
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
                  className={`relative -mb-px flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {active && (
                    <span
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                      style={{ background: ACCENT }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Sekme gövdesi */}
          <div className="rounded-b-xl rounded-tr-xl border border-t-0 border-gray-200 bg-white p-3 md:p-4">
            {tab === 'vehicle' && <VehicleFinder />}

            {tab === 'vin' && (
              <div className="flex items-center gap-2">
                <Search className="ml-2 h-4 w-4 flex-shrink-0 text-gray-400" />
                <input
                  type="text"
                  value={vin}
                  onChange={e => { setVin(e.target.value.toUpperCase()); setErr('') }}
                  onKeyDown={e => e.key === 'Enter' && submitVin()}
                  placeholder="Örn. WVWZZZ1JZ3W386752 (17 karakter)"
                  maxLength={17}
                  className="flex-1 bg-transparent py-2.5 font-mono text-sm tracking-widest text-gray-900 outline-none placeholder:text-gray-400"
                />
                <span className="hidden text-[11px] tabular-nums text-gray-400 sm:block">{vin.length}/17</span>
                <button
                  onClick={submitVin}
                  className="group inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
                  style={{ background: ACCENT }}
                >
                  Ara <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            )}

            {tab === 'oem' && (
              <div className="flex items-center gap-2">
                <Search className="ml-2 h-4 w-4 flex-shrink-0 text-gray-400" />
                <input
                  type="text"
                  value={oem}
                  onChange={e => { setOem(e.target.value); setErr('') }}
                  onKeyDown={e => e.key === 'Enter' && submitOem()}
                  placeholder="OEM / parça numarası (örn. 8E0407151)"
                  className="flex-1 bg-transparent py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
                <button
                  onClick={submitOem}
                  className="group inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
                  style={{ background: ACCENT }}
                >
                  Ara <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            )}

            {err && <p className="mt-2 px-1 text-xs text-red-600">{err}</p>}
          </div>
        </div>

      </div>
    </section>
  )
}
