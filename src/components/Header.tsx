'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu, X, LogIn, User, LogOut, Warehouse, UserPlus, Store,
  ChevronDown, Search, ShoppingBag, Package, Settings, Tag,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import LogoLink from '@/components/Logo'
import { siteConfig } from '@/lib/config'

// BrandBar kaldırıldı (Faz 3.1) — landing'de Brands grid'i var, header'da gerek yok

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  // Header her zaman beyaz/solid — transparent state kaldırıldı (sade e-ticaret hissi için)
  const accountRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return

    // Tek arama kutusu: OEM de parça adı da ilan aramasına gider.
    router.push(`/ilanlar?q=${encodeURIComponent(q)}`)
    setSearchQuery('')
    setIsMenuOpen(false)
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        {/* ═══ Top Bar ═══ */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            {/* Logo — Wordmark (md+), Monogram (mobile) */}
            <LogoLink size={1} className="flex-shrink-0" />

            {/* Desktop Search Bar — wide */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ürün, OEM numarası veya parça ara..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                />
              </div>
            </form>

            {/* Right Actions */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Pazaryeri — satıcıların yayınladığı ilanlar */}
              <Link
                href="/ilanlar"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/ilanlar') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Tag className="w-4 h-4" />
                İlanlar
              </Link>


              {/* Satıcı kazanımı — arz tarafı ürünün darboğazı, girişi görünür tut.
                  Ayrı origin: <Link> değil <a> olmalı. */}
              <a
                href={siteConfig.surfaces.seller}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
              >
                <Store className="w-4 h-4" />
                Mağaza Aç
              </a>

              {/* Cart */}

              {/* Account */}
              {user ? (
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={() => setIsAccountOpen(!isAccountOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">{user.name}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isAccountOpen && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 animate-fadeIn z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link href="/hesabim/garaj" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Warehouse className="w-4 h-4 text-gray-400" /> Garajım
                      </Link>
                      <Link href="/hesabim/profil" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <User className="w-4 h-4 text-gray-400" /> Profil
                      </Link>
                      <Link href="/hesabim/ayarlar" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4 text-gray-400" /> Ayarlar
                      </Link>
                      <div className="h-px bg-gray-100 mx-2" />
                      <button
                        onClick={() => { logout(); setIsAccountOpen(false) }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/giris"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-medium"
                  >
                    <LogIn className="w-4 h-4" />
                    Giriş Yap
                  </Link>
                  <Link
                    href="/kayit"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-all text-sm font-medium"
                  >
                    <UserPlus className="w-4 h-4" />
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: Cart + Menu */}
            <div className="flex items-center gap-1 lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900"
                aria-label={isMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

        </div>

        {/* ═══ Mobile Menu ═══ */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 border-t border-gray-200 container mx-auto px-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ürün veya OEM numarası ara..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                />
              </div>
            </form>

            <nav className="flex flex-col gap-1">
              {[
                { href: '/ilanlar', label: 'İlanlar', icon: Tag },
                { href: '/hakkimizda', label: 'Hakkımızda' },
                { href: '/hakkimizda', label: 'Hakkımızda' },
                { href: '/iletisim', label: 'İletişim' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-lg transition-all text-sm font-medium flex items-center gap-2 ${
                    isActive(link.href) ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {'icon' in link && link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              ))}

              <a
                href={siteConfig.surfaces.seller}
                className="px-4 py-3 rounded-lg transition-all text-sm font-medium flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                onClick={() => setIsMenuOpen(false)}
              >
                <Store className="w-4 h-4" />
                Mağaza Aç
              </a>

              {user ? (
                <>
                  <div className="h-px bg-gray-100 mx-2 my-1" />
                  <Link href="/hesabim/garaj" className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>
                    <Warehouse className="w-4 h-4" /> Garajım
                  </Link>
                  <Link href="/hesabim/profil" className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>
                    <User className="w-4 h-4" /> Profil
                  </Link>
                  <div className="px-4 py-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-primary-600" />
                    </div>
                    <span className="text-sm text-gray-500 truncate">{user.name}</span>
                  </div>
                  <button
                    onClick={() => { logout(); setIsMenuOpen(false) }}
                    className="flex items-center gap-2 px-4 py-3 text-left text-red-500 hover:bg-red-50 rounded-lg transition-all text-sm"
                  >
                    <LogOut className="w-4 h-4" /> Çıkış Yap
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-3 px-4">
                  <Link
                    href="/giris"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LogIn className="w-4 h-4" /> Giriş Yap
                  </Link>
                  <Link
                    href="/kayit"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary-500 text-white text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus className="w-4 h-4" /> Kayıt Ol
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>
    </>
  )
}
