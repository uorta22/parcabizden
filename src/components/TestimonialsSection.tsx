'use client'

import { useEffect, useRef, useState } from 'react'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Mehmet Yılmaz', role: 'Oto Tamircisi, İstanbul', rating: 5,
    text: 'Müşterilerim için sık sık parça aratıyorum. ParcaBizden sayesinde VIN numarasını girip saniyeler içinde doğru parçayı buluyorum. Zaman ve para tasarrufu sağladı.',
    vehicle: 'BMW E46 — Fren diski', avatar: 'MY',
  },
  {
    name: 'Ayşe Karan', role: 'Bireysel Kullanıcı, Ankara', rating: 5,
    text: 'WhatsApp\'tan sordum, 5 dakika içinde fiyat teklifi geldi. Parçam aynı gün kargolandı. Harika hizmet!',
    vehicle: 'Toyota Corolla — Yağ filtresi', avatar: 'AK',
  },
  {
    name: 'Hasan Demir', role: '2. El Araç Satıcısı, İzmir', rating: 5,
    text: 'Çıkma parça bulmak çok kolaylaştı. Şase ile girince tam uyumlu parçaları gösteriyor. Fiyatlar da çok uygun.',
    vehicle: 'VW Passat — Ön far', avatar: 'HD',
  },
  {
    name: 'Fatma Arslan', role: 'Bireysel Kullanıcı, Bursa', rating: 4,
    text: 'AI asistan özelliği çok iyi. Hangi parçayı arayacağımı bilmiyordum, AI bana yol gösterdi.',
    vehicle: 'Renault Clio — Süspansiyon', avatar: 'FA',
  },
  {
    name: 'Ali Çelik', role: 'Servis Sahibi, Konya', rating: 5,
    text: 'Eski yöntemlerle saatlerce uğraşıyorduk. Şimdi dakikada parça buluyoruz. Kesinlikle tavsiye ediyorum.',
    vehicle: 'Ford Focus — Motor parçaları', avatar: 'AÇ',
  },
]

export default function TestimonialsSection() {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)
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
    if (!autoPlay || !visible) return
    const t = setInterval(() => setActive(a => (a + 1) % testimonials.length), 4500)
    return () => clearInterval(t)
  }, [autoPlay, visible])

  const prev = () => { setAutoPlay(false); setActive(a => (a - 1 + testimonials.length) % testimonials.length) }
  const next = () => { setAutoPlay(false); setActive(a => (a + 1) % testimonials.length) }

  const t = testimonials[active]

  return (
    <section ref={ref} className="py-20 md:py-32 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1628 0%, #1a2652 50%, #0f1628 100%)' }}>
      <div className="container mx-auto px-4">
        <div className={`text-center mb-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-3 py-1 text-xs font-bold tracking-widest uppercase rounded-full border mb-4"
            style={{ background: 'rgba(249,172,27,0.12)', borderColor: 'rgba(249,172,27,0.3)', color: '#f9ac1b' }}>
            Müşteri Yorumları
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Binlerce Memnun <span className="text-primary-400">Müşteri</span>
          </h2>
          <p className="text-white/40 text-sm">Gerçek kullanıcılar, gerçek deneyimler</p>
        </div>

        <div className={`max-w-3xl mx-auto transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: '200ms' }}>
          <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-10 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #f9ac1b, transparent 70%)' }} />

            <Quote className="w-12 h-12 text-primary-500/30 mb-6" />

            <div key={active} className="animate-fadeIn">
              <div className="flex gap-1 mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < t.rating ? 'text-primary-400 fill-primary-400' : 'text-white/20'}`} />
                ))}
              </div>

              <blockquote className="text-white/90 text-lg md:text-xl leading-relaxed mb-8 font-light">
                &ldquo;{t.text}&rdquo;
              </blockquote>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{t.name}</div>
                    <div className="text-white/40 text-sm">{t.role}</div>
                  </div>
                </div>
                <div className="text-xs px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(249,172,27,0.12)', border: '1px solid rgba(249,172,27,0.25)', color: '#f9ac1b' }}>
                  {t.vehicle}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <button onClick={prev} className="w-10 h-10 rounded-full flex items-center justify-center border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setAutoPlay(false); setActive(i) }}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === active ? '24px' : '8px',
                    height: '8px',
                    background: i === active ? '#f9ac1b' : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </div>

            <button onClick={next} className="w-10 h-10 rounded-full flex items-center justify-center border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
