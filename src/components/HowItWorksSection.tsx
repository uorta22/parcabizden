'use client'

import { useEffect, useRef, useState } from 'react'
import { Car, Search, MessageCircle, ChevronRight, CheckCircle } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Car,
    title: 'Aracınızı Tanımlayın',
    desc: 'Şase (VIN) numaranızı veya marka/model bilginizi girin. Sistem aracınızı otomatik olarak tanır ve size özel katalog açılır.',
    accent: '#f9ac1b',
    demo: [
      'Şase numarası: WVWZZZ1JZ...',
      '✓ VW Passat 1.9 TDI tespit edildi',
      '✓ 2003 model, B5.5 nesil',
    ],
  },
  {
    number: '02',
    icon: Search,
    title: 'Parçayı Seçin',
    desc: 'Kategorilere göre göz atın ya da doğrudan OEM numarasıyla arayın. 10.000\'den fazla parça arasından aracınıza tam uyumlu olanları görün.',
    accent: '#3b82f6',
    demo: [
      'Kategori: Fren Sistemi',
      'Alt grup: Fren diski ön',
      '✓ 4 uyumlu parça bulundu',
    ],
  },
  {
    number: '03',
    icon: MessageCircle,
    title: 'Anında Talep Edin',
    desc: 'Beğendiğiniz parçayı WhatsApp\'a tek tıkla gönderin. Uzman ekibimiz fiyat ve stok bilgisini hemen iletir.',
    accent: '#22c55e',
    demo: [
      'WhatsApp\'a gönderildi ✓',
      'Yanıt süresi: ~2 dakika',
      '✓ Fiyat teklifi alındı',
    ],
  },
]

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % steps.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [visible])

  return (
    <section ref={ref} className="py-20 md:py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold tracking-widest uppercase rounded-full border border-primary-200 mb-4">
            Nasıl Çalışır
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
            3 Adımda <span className="text-primary-500">Parçanızı Bulun</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Karmaşık kataloglarda kaybolmadan, dakikalar içinde aradığınız parçaya ulaşın.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div className="space-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon
              const isActive = activeStep === i
              return (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{
                    transitionDelay: `${i * 150}ms`,
                    borderColor: isActive ? step.accent : '#e5e7eb',
                    background: isActive ? `linear-gradient(135deg, ${step.accent}10, ${step.accent}05)` : 'white',
                    boxShadow: isActive ? `0 4px 24px ${step.accent}20` : 'none',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300" style={{ background: isActive ? step.accent : '#f3f4f6' }}>
                      <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black tracking-widest" style={{ color: isActive ? step.accent : '#9ca3af' }}>{step.number}</span>
                        <h3 className={`font-bold text-sm transition-colors ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>{step.title}</h3>
                      </div>
                      {isActive && (
                        <p className="text-gray-500 text-xs leading-relaxed animate-fadeIn">{step.desc}</p>
                      )}
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all ${isActive ? 'rotate-90' : ''}`} style={{ color: isActive ? step.accent : '#d1d5db' }} />
                  </div>
                </button>
              )
            })}
          </div>

          <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`} style={{ transitionDelay: '300ms' }}>
            <div className="relative rounded-2xl overflow-hidden" style={{ background: '#0f1628', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <div className="flex-1 ml-3">
                  <div className="text-[10px] text-gray-600 bg-white/5 rounded px-3 py-1 font-mono">parcabizden.com.tr</div>
                </div>
              </div>

              <div className="p-6 min-h-[260px]">
                {steps.map((step, i) => (
                  <div key={i} className={`transition-all duration-500 ${activeStep === i ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: step.accent }}>
                        <step.icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{step.number}</p>
                        <p className="text-white text-sm font-bold">{step.title}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {step.demo.map((line, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-3 p-3 rounded-lg"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            animation: `fadeIn 0.4s ease-out ${j * 200}ms both`,
                          }}
                        >
                          {line.startsWith('✓') ? (
                            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: step.accent }} />
                          ) : (
                            <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center" style={{ background: `${step.accent}20` }}>
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: step.accent }} />
                            </div>
                          )}
                          <span className="text-gray-300 text-xs font-mono">{line.replace('✓ ', '')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: activeStep === i ? '100%' : '0%',
                            background: step.accent,
                            transitionDuration: activeStep === i ? '3500ms' : '0ms',
                            transitionTimingFunction: 'linear',
                          }}
                        />
                      </div>
                    </div>
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
