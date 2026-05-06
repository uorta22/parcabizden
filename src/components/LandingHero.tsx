'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, MessageCircle, Sparkles, Car, Hash, ChevronDown, Shield, Zap, Clock } from 'lucide-react'
import { getWhatsAppUrl, siteConfig } from '@/lib/config'

export default function LandingHero() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'vin' | 'oem'>('vin')
  const [vin, setVin] = useState('')
  const [oem, setOem] = useState('')
  const [vinError, setVinError] = useState('')
  const [oemError, setOemError] = useState('')

  const handleVinSearch = useCallback(() => {
    const v = vin.trim().toUpperCase()
    if (!v) { setVinError('Şase numarası girin'); return }
    if (v.length !== 17) { setVinError('VIN tam olarak 17 karakter olmalı'); return }
    setVinError('')
    router.push(`/?vin=${v}#arama`)
  }, [vin, router])

  const handleOemSearch = useCallback(() => {
    const q = oem.trim()
    if (!q || q.length < 3) { setOemError('En az 3 karakter girin'); return }
    setOemError('')
    router.push(`/parca/${encodeURIComponent(q)}`)
  }, [oem, router])

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#0f1628]">
      {/* ── Animated background ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(249,172,27,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(249,172,27,0.6) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
        {/* Glow orbs */}
        <div className="absolute top-1/4 -left-40 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #f9ac1b 0%, transparent 70%)', animation: 'orb1 8s ease-in-out infinite' }} />
        <div className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #3c4f82 0%, transparent 70%)', animation: 'orb2 10s ease-in-out infinite' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #f9ac1b 0%, transparent 60%)', animation: 'orb3 15s ease-in-out infinite' }} />
        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-primary-400 opacity-20"
            style={{
              width: `${[3,4,2,5,3,4,2,3,5,4,3,2][i]}px`,
              height: `${[3,4,2,5,3,4,2,3,5,4,3,2][i]}px`,
              left: `${[8,18,30,45,55,68,75,82,90,25,60,40][i]}%`,
              top: `${[20,65,35,80,15,50,70,25,45,90,10,55][i]}%`,
              animation: `particle ${[6,8,7,9,6,8,7,6,9,8,7,6][i]}s ease-in-out infinite`,
              animationDelay: `${[0,1,2,0.5,1.5,0,2.5,1,0.5,2,1.5,0][i]}s`,
            }}
          />
        ))}
        {/* Diagonal accent line */}
        <div className="absolute top-0 right-[15%] w-px h-full bg-gradient-to-b from-transparent via-primary-500/20 to-transparent" />
        <div className="absolute top-0 right-[30%] w-px h-full bg-gradient-to-b from-transparent via-primary-500/10 to-transparent" />
      </div>

      {/* ── Main content ── */}
      <div className="relative flex-1 flex flex-col justify-center container mx-auto px-4 pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="max-w-5xl mx-auto w-full">
          {/* Badge */}
          <div className="flex justify-center mb-6 animate-fadeIn" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border" style={{ background: 'rgba(249,172,27,0.12)', borderColor: 'rgba(249,172,27,0.3)', color: '#f9ac1b' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
              Türkiye&apos;nin Akıllı Parça Platformu
            </span>
          </div>

          {/* Headline */}
          <div className="text-center mb-8 animate-fadeIn" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-4">
              Yedek Parça Bulmak
              <br />
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #f9ac1b, #fcd48c, #f9ac1b)', backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }}>
                  Bu Kadar Kolay
                </span>
              </span>
            </h1>
            <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
              Şase numarası veya OEM kodu ile aracınıza birebir uygun yedek ve çıkma parçaları saniyeler içinde bulun.
            </p>
          </div>

          {/* Search card */}
          <div className="max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.35s', animationFillMode: 'both' }}>
            <div className="relative rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,172,27,0.1)' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 opacity-60" style={{ background: 'linear-gradient(90deg, transparent, #f9ac1b, transparent)' }} />

              <div className="p-6 md:p-8">
                {/* Tabs */}
                <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <button
                    onClick={() => setActiveTab('vin')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      activeTab === 'vin' ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    Şase (VIN) ile Ara
                  </button>
                  <button
                    onClick={() => setActiveTab('oem')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      activeTab === 'oem' ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Hash className="w-4 h-4" />
                    OEM Numarası ile Ara
                  </button>
                </div>

                {/* VIN input */}
                {activeTab === 'vin' && (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={vin}
                          onChange={e => { setVin(e.target.value.toUpperCase()); setVinError('') }}
                          onKeyDown={e => e.key === 'Enter' && handleVinSearch()}
                          placeholder="WVWZZZ1JZ3W386752"
                          maxLength={17}
                          className="hero-input w-full pl-12 pr-14 py-4 rounded-xl font-mono text-sm tracking-widest text-white placeholder-gray-600 outline-none transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-600 tabular-nums font-mono">{vin.length}/17</span>
                      </div>
                      <button onClick={handleVinSearch} className="px-6 py-4 bg-primary-500 hover:bg-primary-400 text-white font-bold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(249,172,27,0.4)] active:scale-95 flex-shrink-0">
                        <Search className="w-5 h-5" />
                      </button>
                    </div>
                    {vinError && <p className="text-red-400 text-xs flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />{vinError}</p>}
                    <p className="text-gray-600 text-xs">VIN: ruhsatta, ön cam sol köşede veya kapı çerçevesinde bulunur.</p>
                  </div>
                )}

                {/* OEM input */}
                {activeTab === 'oem' && (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={oem}
                          onChange={e => { setOem(e.target.value); setOemError('') }}
                          onKeyDown={e => e.key === 'Enter' && handleOemSearch()}
                          placeholder="Örn: 8E0407151"
                          className="hero-input w-full pl-12 pr-4 py-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
                        />
                      </div>
                      <button onClick={handleOemSearch} className="px-6 py-4 bg-primary-500 hover:bg-primary-400 text-white font-bold rounded-xl transition-all hover:shadow-[0_0_30px_rgba(249,172,27,0.4)] active:scale-95 flex-shrink-0">
                        <Search className="w-5 h-5" />
                      </button>
                    </div>
                    {oemError && <p className="text-red-400 text-xs flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />{oemError}</p>}
                    <p className="text-gray-600 text-xs">OEM numarasını parça üzerindeki etikette veya araç kataloğunda bulabilirsiniz.</p>
                  </div>
                )}

                {/* Divider */}
                <div className="flex items-center gap-4 my-5">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-xs text-gray-600 tracking-widest uppercase">veya</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={getWhatsAppUrl(siteConfig.whatsapp.partRequestMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95"
                    style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', color: '#4ade80' }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp ile Sor
                  </a>
                  <Link
                    href="/ai-asistan"
                    className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95"
                    style={{ background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)', color: '#c084fc' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Asistan
                  </Link>
                </div>
              </div>
            </div>

            {/* Trust strip */}
            <div className="flex justify-center items-center gap-6 md:gap-10 mt-6">
              {[
                { icon: Shield, label: 'Kalite Garantili' },
                { icon: Zap, label: 'Anında Sonuç' },
                { icon: Clock, label: '7/24 Destek' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-gray-500 text-xs">
                  <Icon className="w-3.5 h-3.5 text-primary-500" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600">
          <span className="text-xs tracking-widest uppercase">Keşfet</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </div>
      </div>
    </section>
  )
}
