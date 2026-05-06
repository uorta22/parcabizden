'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Shield, Zap, MessageCircle, Car, Database, Brain, Clock } from 'lucide-react'

const features = [
  {
    icon: Search, title: 'VIN ile Akıllı Arama',
    desc: 'Şase numaranızdan marka, model, yıl ve motor bilgilerini otomatik tespit eder. Aracınıza özel katalog saniyeler içinde hazır.',
    accent: '#f9ac1b', tag: 'Temel Özellik', size: 'lg',
  },
  {
    icon: Database, title: '10.000+ Parça Kataloğu',
    desc: 'Geniş stok havuzumuzda yedek ve çıkma parçaları tek platformda.',
    accent: '#3b82f6', tag: 'Katalog', size: 'sm',
  },
  {
    icon: MessageCircle, title: 'Anında WhatsApp Talebi',
    desc: 'Seçtiğiniz parçayı tek tıkla WhatsApp\'a gönderin, fiyat teklifi alın.',
    accent: '#22c55e', tag: 'Hızlı İletişim', size: 'sm',
  },
  {
    icon: Brain, title: 'AI Asistan',
    desc: 'Hangi parçaya ihtiyacınız olduğundan emin değil misiniz? AI asistanımız belirtilerinizi analiz ederek doğru parçayı önerir.',
    accent: '#a855f7', tag: 'Yapay Zeka', size: 'lg',
  },
  {
    icon: Car, title: 'Garaj Yönetimi',
    desc: 'Araçlarınızı kaydedin, bakım takibi yapın.',
    accent: '#f97316', tag: 'Kişisel', size: 'sm',
  },
  {
    icon: Shield, title: 'Kalite Kontrolü',
    desc: 'Her parça titizlikle incelenir, orijinalliği doğrulanır.',
    accent: '#06b6d4', tag: 'Güven', size: 'sm',
  },
  {
    icon: Zap, title: 'Hızlı Teslimat',
    desc: 'Türkiye\'nin her noktasına hızlı kargo, kapınıza kadar.',
    accent: '#eab308', tag: 'Lojistik', size: 'sm',
  },
  {
    icon: Clock, title: '7/24 Destek',
    desc: 'Gece gündüz WhatsApp Business hattımızla yanınızdayız.',
    accent: '#ec4899', tag: 'Destek', size: 'sm',
  },
]

export default function FeaturesSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-20 md:py-32 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-bold tracking-widest uppercase rounded-full border border-primary-200 mb-4">
            Özellikler
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
            Neden <span className="text-primary-500">ParcaBizden?</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Geleneksel parça arama yöntemlerini geride bırakan akıllı platform
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {features.map((f, i) => {
            const Icon = f.icon
            const isLarge = f.size === 'lg'
            return (
              <div
                key={i}
                className={`group relative rounded-2xl p-6 border border-gray-200 bg-white transition-all duration-500 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 cursor-default
                  ${isLarge ? 'md:col-span-2' : ''}
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 0% 0%, ${f.accent}10, transparent 60%)` }} />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{ background: `${f.accent}15`, border: `1px solid ${f.accent}30` }}>
                      <Icon className="w-5 h-5" style={{ color: f.accent }} />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
                      style={{ background: `${f.accent}12`, color: f.accent }}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 className={`font-bold text-gray-900 mb-2 ${isLarge ? 'text-lg' : 'text-sm'}`}>{f.title}</h3>
                  <p className={`text-gray-500 leading-relaxed ${isLarge ? 'text-sm' : 'text-xs'}`}>{f.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
