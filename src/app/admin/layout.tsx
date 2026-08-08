'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Package, ShoppingCart, LayoutDashboard, ArrowLeft, Menu, X, Sparkles, Store } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/saticilar', label: 'Satıcılar', icon: Store },
  { href: '/admin/urunler', label: 'Ürünler', icon: Package },
  { href: '/admin/urunler/zenginlestir', label: 'Zenginleştir', icon: Sparkles },
  { href: '/admin/siparisler', label: 'Siparişler', icon: ShoppingCart },
]

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 dakika

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => {
      logout()
      router.replace('/')
    }, INACTIVITY_TIMEOUT)
  }, [logout, router])

  // 30dk inactivity timeout
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const handler = () => resetInactivityTimer()

    events.forEach(e => document.addEventListener(e, handler))
    resetInactivityTimer()

    return () => {
      events.forEach(e => document.removeEventListener(e, handler))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [resetInactivityTimer])

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.replace('/')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !user.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
        <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-gray-600 hover:text-gray-900">
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-bold text-gray-900">Admin Panel</span>
        <Link href="/" className="text-sm text-primary-600 font-medium">Siteye Dön</Link>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-bold text-gray-900">Admin Panel</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarNav pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 bg-white border-r border-gray-200 min-h-screen">
          <div className="px-5 py-5 border-b border-gray-100">
            <h1 className="font-bold text-lg text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-500 mt-0.5">ParcaBizden Yönetim</p>
          </div>
          <SidebarNav pathname={pathname} />
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="py-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-all ${
              isActive
                ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
            {label}
          </Link>
        )
      })}

      <div className="my-3 mx-5 border-t border-gray-100" />

      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
      >
        <ArrowLeft className="w-4 h-4 text-gray-400" />
        Siteye Dön
      </Link>
    </nav>
  )
}
