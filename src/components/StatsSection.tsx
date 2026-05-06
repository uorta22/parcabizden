'use client'

import { useEffect, useRef, useState } from 'react'
import { Users, Package, Car, MessageCircle } from 'lucide-react'

const stats = [
  { icon: Users,         value: 5000,  suffix: '+',   label: 'Mutlu Müşteri',    sub: 'Türkiye geneli' },
  { icon: Package,       value: 10000, suffix: '+',   label: 'Parça Çeşidi',     sub: 'Sürekli güncellenen' },
  { icon: Car,           value: 50,    suffix: '+',   label: 'Araç Markası',     sub: 'Yerli ve yabancı' },
  { icon: MessageCircle, value: 7,     suffix: '/24', label: 'WhatsApp Destek',  sub: 'Anında yanıt' },
]

function useCounter(target: number, duration = 2000, active: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, active])
  return count
}

function StatCard({ icon: Icon, value, suffix, label, sub, delay, active }: {
  icon: typeof Users; value: number; suffix: string; label: string; sub: string; delay: number; active: boolean
}) {
  const count = useCounter(value, 2000, active)
  return (
    <div className="relative group" style={{ animation: active ? `fadeIn 0.6s ease-out ${delay}ms both` : 'none' }}>
      <div className="relative p-8 rounded-2xl text-center transition-all duration-300 group-hover:scale-105"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(249,172,27,0.15), transparent 60%)' }} />

        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-500/20 transition-colors">
            <Icon className="w-7 h-7 text-primary-400" />
          </div>
          <div className="text-4xl md:text-5xl font-black text-white mb-1 tabular-nums">
            {count.toLocaleString('tr-TR')}{suffix}
          </div>
          <div className="text-white/80 font-semibold mb-1">{label}</div>
          <div className="text-white/30 text-xs">{sub}</div>
        </div>
      </div>
    </div>
  )
}

export default function StatsSection() {
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
    <section ref={ref} className="py-20 md:py-28 relative overflow-hidden" style={{ background: '#0f1628' }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle, rgba(249,172,27,0.8) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(249,172,27,0.4), transparent)' }} />
        <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(249,172,27,0.4), transparent)' }} />
      </div>

      <div className="relative container mx-auto px-4">
        <div className={`text-center mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Rakamlarla <span className="text-primary-400">ParcaBizden</span>
          </h2>
          <p className="text-white/40 text-sm">Güven, hız ve kaliteyi bir arada sunuyoruz</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} delay={i * 150} active={visible} />
          ))}
        </div>
      </div>
    </section>
  )
}
