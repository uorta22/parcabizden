'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Search, CheckCircle, MessageCircle, ChevronRight, Car, Hash, Zap } from 'lucide-react'

type DemoStep = { id: number; title: string; subtitle: string; duration: number }

const DEMO_STEPS: DemoStep[] = [
  { id: 1, title: 'VIN Girin',         subtitle: 'Şase numaranızı yazın',      duration: 2800 },
  { id: 2, title: 'Araç Tanındı',      subtitle: 'Marka, model, yıl otomatik',  duration: 2200 },
  { id: 3, title: 'Parçaları Görün',   subtitle: 'Kategoriye göre filtrele',    duration: 2500 },
  { id: 4, title: 'Talep Gönder',      subtitle: 'WhatsApp\'a tek tıkla',       duration: 2000 },
]

const TOTAL_DURATION = DEMO_STEPS.reduce((a, s) => a + s.duration, 0)

function VinTypingAnimation({ active }: { active: boolean }) {
  const [text, setText] = useState('')
  const vinTarget = 'WVWZZZ1JZ3W386752'
  useEffect(() => {
    if (!active) { setText(''); return }
    let i = 0
    const iv = setInterval(() => {
      if (i >= vinTarget.length) { clearInterval(iv); return }
      setText(vinTarget.slice(0, i + 1))
      i++
    }, 90)
    return () => clearInterval(iv)
  }, [active])
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
      <span className="font-mono text-sm text-white tracking-widest flex-1">
        {text}<span className="animate-pulse text-primary-400">|</span>
      </span>
      <span className="text-xs text-gray-600 tabular-nums">{text.length}/17</span>
    </div>
  )
}

function VehicleFoundAnimation({ active }: { active: boolean }) {
  const fields = [
    { label: 'Marka',     value: 'Volkswagen' },
    { label: 'Model',     value: 'Passat B5.5' },
    { label: 'Yıl',       value: '2003' },
    { label: 'Motor',     value: '1.9 TDI — 101 HP' },
    { label: 'Yakıt',     value: 'Dizel' },
    { label: 'Şanzıman',  value: 'Manuel' },
  ]
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="w-5 h-5 text-green-400" />
        <span className="text-green-400 text-sm font-semibold">Araç tanımlandı</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {fields.map((f, i) => (
          <div
            key={f.label}
            className="p-2.5 rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              animation: active ? `fadeIn 0.4s ease-out ${i * 100}ms both` : 'none',
              opacity: active ? undefined : 0,
            }}
          >
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">{f.label}</div>
            <div className="text-white text-xs font-semibold mt-0.5">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PartsListAnimation({ active }: { active: boolean }) {
  const parts = [
    { name: 'Fren Diski Ön (çift)', oem: '3C0615301H', compat: 'Birebir Uyumlu' },
    { name: 'Balata Seti Ön',       oem: '3C0698151',  compat: 'Birebir Uyumlu' },
    { name: 'Fren Kaliperi Sol',    oem: '3C0615123',  compat: 'Birebir Uyumlu' },
  ]
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-400 mb-3 flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 text-[10px] font-bold">Fren Sistemi</span>
        <span>{parts.length} parça bulundu</span>
      </div>
      {parts.map((p, i) => (
        <div
          key={p.oem}
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            animation: active ? `fadeIn 0.4s ease-out ${i * 150}ms both` : 'none',
            opacity: active ? undefined : 0,
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
            <Car className="w-4 h-4 text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{p.name}</div>
            <div className="text-gray-500 text-[10px] font-mono">{p.oem}</div>
          </div>
          <span className="text-[9px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full flex-shrink-0">{p.compat}</span>
        </div>
      ))}
    </div>
  )
}

function WhatsappAnimation({ active }: { active: boolean }) {
  const [sent, setSent] = useState(false)
  useEffect(() => {
    if (!active) { setSent(false); return }
    const t = setTimeout(() => setSent(true), 1200)
    return () => clearTimeout(t)
  }, [active])

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl" style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)' }}>
        <div className="text-[10px] text-gray-500 mb-2 flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5 text-green-400" />
          WhatsApp Mesajı
        </div>
        <p className="text-green-300 text-xs leading-relaxed">
          Merhaba, VW Passat 2003 1.9 TDI aracım için Fren Diski Ön (3C0615301H) parçasını arıyorum.<br />
          Şase: WVWZZZ1JZ3W386752
        </p>
      </div>

      {sent && (
        <div className="flex flex-col items-center gap-3 animate-fadeIn">
          <CheckCircle className="w-10 h-10 text-green-400" />
          <div className="text-center">
            <div className="text-white font-semibold text-sm">Talep Gönderildi!</div>
            <div className="text-gray-400 text-xs mt-1">Ortalama yanıt: ~2 dakika</div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Uzmanınız yanıt yazıyor...
          </div>
        </div>
      )}
    </div>
  )
}

export default function DemoVideoSection() {
  const [playing, setPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); setPlaying(true) } },
      { threshold: 0.4 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 50
        if (next >= TOTAL_DURATION) {
          setPlaying(false)
          return TOTAL_DURATION
        }
        let acc = 0
        for (let i = 0; i < DEMO_STEPS.length; i++) {
          acc += DEMO_STEPS[i].duration
          if (next < acc) { setCurrentStep(i); break }
        }
        return next
      })
    }, 50)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [playing])

  const restart = () => {
    setElapsed(0)
    setCurrentStep(0)
    setPlaying(true)
  }

  const progress = (elapsed / TOTAL_DURATION) * 100

  return (
    <section ref={ref} className="py-20 md:py-32 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-bold tracking-widest uppercase rounded-full border border-primary-200 mb-4">
            Canlı Demo
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
            Platformu <span className="text-primary-500">Keşfedin</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            VIN numarasından parça talebine — ParcaBizden&apos;in nasıl çalıştığını canlı olarak izleyin
          </p>
        </div>

        <div className={`max-w-5xl mx-auto transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: '200ms' }}>
          <div className="grid md:grid-cols-5 gap-6">
            <div className="md:col-span-2 space-y-3">
              {DEMO_STEPS.map((step, i) => {
                const isActive = currentStep === i
                const isPast   = i < currentStep || (!playing && elapsed >= TOTAL_DURATION)
                const icons = [Car, CheckCircle, Search, MessageCircle]
                const Icon = icons[i]
                const colors = ['#f9ac1b', '#22c55e', '#3b82f6', '#22c55e']
                return (
                  <div
                    key={step.id}
                    className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300"
                    style={{
                      borderColor: isActive ? colors[i] : isPast ? `${colors[i]}40` : '#e5e7eb',
                      background: isActive ? `${colors[i]}10` : 'white',
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ background: (isActive || isPast) ? colors[i] : '#f3f4f6' }}>
                      {isPast && !isActive ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Icon className={`w-5 h-5 ${(isActive || isPast) ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] font-black tracking-widest uppercase" style={{ color: (isActive || isPast) ? colors[i] : '#9ca3af' }}>
                        Adım {step.id}
                      </div>
                      <div className={`text-sm font-bold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{step.title}</div>
                      <div className="text-xs text-gray-400">{step.subtitle}</div>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0 animate-pulse" style={{ color: colors[i] }} />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="md:col-span-3">
              <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0f1628' }}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white/5 rounded-lg px-3 py-1.5 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[10px] text-gray-500 font-mono">parcabizden.com.tr</span>
                      <Zap className="w-3 h-3 text-primary-400 ml-auto" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPlaying(p => !p)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: 'rgba(249,172,27,0.15)', border: '1px solid rgba(249,172,27,0.3)' }}
                    >
                      {playing ? <Pause className="w-3.5 h-3.5 text-primary-400" /> : <Play className="w-3.5 h-3.5 text-primary-400" />}
                    </button>
                    <button
                      onClick={restart}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="p-6 min-h-[320px]">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                      <span className="text-[10px] text-primary-400 font-black">{currentStep + 1}</span>
                    </div>
                    <span className="text-white/60 text-xs">{DEMO_STEPS[currentStep]?.subtitle}</span>
                  </div>

                  <div className="space-y-4">
                    {currentStep === 0 && <VinTypingAnimation active={playing || elapsed > 0} />}
                    {currentStep === 1 && <VehicleFoundAnimation active />}
                    {currentStep === 2 && <PartsListAnimation active />}
                    {currentStep === 3 && <WhatsappAnimation active />}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-100"
                      style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #f9ac1b, #fcd48c)' }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-gray-600">{DEMO_STEPS[currentStep]?.title}</span>
                    <span className="text-[10px] text-gray-600 tabular-nums">{Math.round(elapsed / 1000)}s / {Math.round(TOTAL_DURATION / 1000)}s</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { icon: Car,           label: 'VIN ile Tanı',     color: '#f9ac1b' },
                  { icon: Hash,          label: 'OEM Arama',        color: '#3b82f6' },
                  { icon: MessageCircle, label: 'WhatsApp Talep',   color: '#22c55e' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 text-center">
                    <Icon className="w-5 h-5" style={{ color }} />
                    <span className="text-xs font-semibold text-gray-700">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
