'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Tag, Inbox, BadgeCheck, Store, Menu, X, LogOut, Loader2,
} from 'lucide-react'
import LogoLink from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { href: '/', label: 'Panel', icon: LayoutDashboard, exact: true },
  { href: '/ilanlarim', label: 'İlanlarım', icon: Tag },
  { href: '/talepler', label: 'Gelen Talepler', icon: Inbox },
  { href: '/tekliflerim', label: 'Tekliflerim', icon: BadgeCheck },
  { href: '/basvuru', label: 'Mağazam', icon: Store },
]

// Panel kabuğu bu sayfalarda gösterilmez — ilk temas noktası, gezinme çubuğu
// olmadan yalnızca formun kendisi görünmeli.
const BARE_PATHS = ['/giris', '/kayit']

export default function PanelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading: authLoading, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (BARE_PATHS.includes(pathname)) {
    return <>{children}</>
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobil üst çubuk */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-3 lg:hidden">
        <button onClick={() => setDrawerOpen(true)} className="p-1.5 text-gray-300 hover:text-white" aria-label="Menüyü aç">
          <Menu className="h-5 w-5" />
        </button>
        <LogoLink size={0.7} light />
        <UserBadge authLoading={authLoading} email={user?.email} compact />
      </div>

      {/* Mobil çekmece */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-gray-950">
            <div className="flex items-center justify-between px-5 py-4">
              <LogoLink size={0.7} light />
              <button onClick={() => setDrawerOpen(false)} className="p-1 text-gray-400 hover:text-white" aria-label="Menüyü kapat">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Nav pathname={pathname} isActive={isActive} onNavigate={() => setDrawerOpen(false)} />
            <SidebarFooter authLoading={authLoading} email={user?.email} onLogout={logout} />
          </aside>
        </div>
      )}

      <div className="lg:flex">
        {/* Masaüstü kenar çubuğu */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:flex-col lg:border-r lg:border-gray-800 lg:bg-gray-950 lg:min-h-screen">
          <div className="border-b border-gray-800 px-5 py-5">
            <LogoLink size={0.75} light />
            <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Satıcı Paneli</p>
          </div>
          <Nav pathname={pathname} isActive={isActive} />
          <div className="mt-auto">
            <SidebarFooter authLoading={authLoading} email={user?.email} onLogout={logout} />
          </div>
        </aside>

        {/* İçerik */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

function Nav({
  pathname, isActive, onNavigate,
}: { pathname: string; isActive: (href: string, exact?: boolean) => boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 py-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 border-l-2 px-5 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? 'border-primary-500 bg-white/5 text-white'
                : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
          >
            <Icon className={`h-4 w-4 ${active ? 'text-primary-500' : 'text-gray-500'}`} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function UserBadge({ authLoading, email, compact }: { authLoading: boolean; email?: string; compact?: boolean }) {
  if (authLoading) return <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
  if (!email) return <span className="text-xs text-gray-500">Misafir</span>
  return (
    <span className={`truncate text-xs font-medium text-gray-400 ${compact ? 'max-w-[120px]' : ''}`}>
      {email}
    </span>
  )
}

function SidebarFooter({
  authLoading, email, onLogout,
}: { authLoading: boolean; email?: string; onLogout: () => void }) {
  if (authLoading || !email) return null
  return (
    <div className="border-t border-gray-800 px-5 py-4">
      <UserBadge authLoading={authLoading} email={email} />
      <button
        onClick={onLogout}
        className="mt-2 flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-300"
      >
        <LogOut className="h-3.5 w-3.5" /> Çıkış Yap
      </button>
    </div>
  )
}
