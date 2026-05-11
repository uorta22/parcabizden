'use client'

/**
 * AssistantWidget — Görsel 3'teki yapıyı modelleyen sağ alt yardımcı.
 *
 * Eski 701 satırlık ChatWidget yerini alır. Chat history tutmuyor;
 * doğrudan quick-action yönlendirici (WhatsApp/Telegram/iç sayfalar).
 *
 * Yapı:
 *  ┌────────────────────────────────────────────┐
 *  │ [avatar] "Nasıl Yardımcı Olabiliriz?"  [×] │  ← gradient header
 *  │                                            │
 *  │ Merhaba [İsim] 👋                           │
 *  │ Hangi konuda yardıma ihtiyacın var?         │
 *  │                                            │
 *  │ [Siparişler] [Araç Seç] [Üyelik]            │  ← 2×3 grid
 *  │ [Kargom]    [WhatsApp]  [Telegram]          │
 *  │                                            │
 *  │ ┌────────── Kampanya kartı ──────────┐    │
 *  │ │ %0 KOMİSYON ve ÜCRETSİZ KARGO        │    │
 *  │ └─────────────────────────────────────┘    │
 *  ├────────────────────────────────────────────┤
 *  │ [🏠 Ana]  [❓ SSS]  [✏️ Asistan]  [📞 Ltşm] │  ← alt nav
 *  └────────────────────────────────────────────┘
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  HelpCircle, X, ShoppingBag, Car, UserCircle, Truck,
  MessageCircle, Send, Home, MessageSquareMore, Headphones, Pencil,
} from 'lucide-react'
import { getWhatsAppUrl } from '@/lib/config'
import { useAuth } from '@/contexts/AuthContext'

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const firstName = (user?.name || 'oto severler').split(' ')[0]

  // ESC ile kapat
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open])

  return (
    <>
      {/* Açık panel */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 transition-opacity sm:bg-transparent"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Yardım Asistanı"
          className="fixed bottom-4 right-4 z-50 flex max-h-[88vh] w-[92vw] max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:bottom-24 sm:right-6"
        >
          {/* HEADER — gradient */}
          <header
            className="relative px-5 pb-7 pt-5 text-white"
            style={{ background: 'linear-gradient(160deg, #4f7bd6 0%, #3b5fb8 100%)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                  <Headphones className="h-6 w-6 text-white" />
                </div>
                <div className="relative rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 shadow-sm">
                  Nasıl Yardımcı Olabiliriz ?
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-0.5 rounded-lg p-1 text-xs font-bold tracking-wider text-white/80 hover:text-white"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
                <span className="text-[10px]">KAPAT</span>
              </button>
            </div>

            <h2 className="mt-6 text-2xl font-black leading-tight">
              Merhaba {firstName} <span aria-hidden>👋</span>
            </h2>
            <p className="mt-1 text-sm text-white/85">Hangi konuda yardıma ihtiyacın var ?</p>

            {/* Quick actions — 2x3 grid, header'ın altına 'yapışır' */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              <QuickAction href="/hesabim/siparisler" icon={<ShoppingBag className="h-4 w-4" />}>Siparişlerim</QuickAction>
              <QuickAction href="/parcalar"           icon={<Car className="h-4 w-4" />}>Aracımı Seç</QuickAction>
              <QuickAction href="/hesabim"            icon={<UserCircle className="h-4 w-4" />}>Üyelik</QuickAction>
              <QuickAction
                href={getWhatsAppUrl('Merhaba, siparişimin kargo durumunu öğrenebilir miyim?')}
                icon={<Truck className="h-4 w-4" />}
                external
              >
                Kargom Nerede
              </QuickAction>
              <QuickAction
                href={getWhatsAppUrl('Merhaba, yardıma ihtiyacım var.')}
                icon={<MessageCircle className="h-4 w-4 text-emerald-600" />}
                external
              >
                Whatsapp
              </QuickAction>
              <QuickAction
                href="https://t.me/parcabizden"
                icon={<Send className="h-4 w-4 text-sky-500" />}
                external
              >
                Telegram
              </QuickAction>
            </div>
          </header>

          {/* GÖVDE — kampanya kartı + ek içerik */}
          <div className="flex-1 overflow-y-auto bg-white p-5">
            <CampaignCard />
          </div>

          {/* ALT NAV */}
          <nav className="grid grid-cols-4 border-t border-gray-100 bg-white" role="tablist">
            <BottomNavItem href="/"           icon={<Home className="h-5 w-5" />}             label="Anasayfa" active />
            <BottomNavItem href="/iletisim"   icon={<MessageSquareMore className="h-5 w-5" />} label="S.S.S." />
            <BottomNavItem href="/ai-asistan" icon={<Pencil className="h-5 w-5" />}            label="Oto Asistan" />
            <BottomNavItem href="/iletisim"   icon={<Headphones className="h-5 w-5" />}        label="İletişim" />
          </nav>
        </div>
      )}

      {/* Floating button — sağ alt */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Yardım Asistanı"
          className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#4f7bd6] text-white shadow-lg ring-4 ring-white transition-transform hover:scale-105 hover:bg-[#3b5fb8] sm:bottom-6 sm:right-6"
        >
          <Headphones className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow">
            1
          </span>
        </button>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────
// Quick action button (header içinde)
// ─────────────────────────────────────────────────────────
function QuickAction({
  href, icon, children, external,
}: { href: string; icon: React.ReactNode; children: React.ReactNode; external?: boolean }) {
  const cls = 'flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-3 text-[11px] font-bold text-[#3b5fb8] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md'
  const content = (<>{icon}<span className="leading-tight">{children}</span></>)
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{content}</a>
  return <Link href={href} className={cls}>{content}</Link>
}

// ─────────────────────────────────────────────────────────
// Kampanya kartı (statik)
// ─────────────────────────────────────────────────────────
function CampaignCard() {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div
        className="relative h-32 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)' }}
      >
        <div className="absolute inset-0 grid place-items-center p-4 text-center text-white">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
              7500₺ ve üzeri alışverişlerinizde 2 taksite
            </p>
            <p className="mt-1 inline-block rounded-md bg-white/15 px-3 py-1 text-base font-black backdrop-blur-sm">
              %0 KOMİSYON
            </p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <span className="inline-block rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-semibold text-sky-700">
          Kampanya
        </span>
        <h3 className="mt-2 text-sm font-bold text-gray-900">
          %0 KOMİSYON ve ÜCRETSİZ KARGO
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
          5000₺ üzeri tüm siparişlerde ücretsiz kargo! 7500₺ ve üzeri 2 taksitli alışverişlerde %0 komisyon!
        </p>
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────
// Alt nav item
// ─────────────────────────────────────────────────────────
function BottomNavItem({
  href, icon, label, active,
}: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 py-3 text-[11px] font-semibold transition-colors ${
        active ? 'text-sky-600' : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
