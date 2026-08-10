'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Car,
  Package,
  MapPin,
  User,
  Heart,
  Settings,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { href: '/hesabim/garaj', label: 'Garajım', icon: Car },
  { href: '/hesabim/siparisler', label: 'Siparişlerim', icon: Package },
  { href: '/hesabim/adresler', label: 'Adreslerim', icon: MapPin },
  { href: '/hesabim/profil', label: 'Profil Bilgilerim', icon: User },
  { href: '/hesabim/favoriler', label: 'Favori Ürünlerim', icon: Heart },
  { href: '/hesabim/ayarlar', label: 'Ayarlar', icon: Settings },
]

export default function HesabimLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/giris')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Ana Sayfa
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Hesabım</span>
        </nav>

        {/* Mobile tab bar */}
        <div className="lg:hidden mb-4 -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 bg-white border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Çıkış
            </button>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex gap-6 items-start">
          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* User greeting */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-orange-50">
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center mb-2">
                  <span className="text-white font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium">Merhaba,</p>
                <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
              </div>

              {/* Navigation */}
              <nav className="py-2">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || pathname.startsWith(href + '/')
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
                      {label}
                    </Link>
                  )
                })}

                {/* Divider */}
                <div className="my-2 mx-5 border-t border-gray-100" />

                {/* Logout */}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  Çıkış Yap
                </button>
              </nav>
            </div>
          </aside>

          {/* Content area */}
          <main className="flex-1 min-w-0">
            <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
