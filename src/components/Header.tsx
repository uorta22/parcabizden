'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu, X, Car, LogIn, User, LogOut, Warehouse, Sparkles, UserPlus,
  ChevronDown, Search, ShoppingBag, Heart, Package, MapPin, Settings,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import CartIcon from '@/components/CartIcon'
import BrandNavBar from '@/components/BrandNavBar'
import CategoryDropdown from '@/components/CategoryDropdown'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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
    if (searchQuery.trim()) {
      router.push(`/urunler?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setIsMenuOpen(false)
    }
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="sticky top-0 z-50 glass">
        {/* ═══ Top Bar ═══ */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg gradient-accent flex items-center justify-center">
                <Car className="w-6 h-6 md:w-7 md:h-7 text-dark-900" />
              </div>
              <div>
                <span className="text-xl md:text-2xl font-bold text-gray-900">
                  Parça<span className="text-primary-500">Bizden</span>
                </span>
                <p className="text-[10px] md:text-xs text-gray-500 -mt-1">Yedek & Çıkma Parça</p>
              </div>
            </Link>

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
              {/* Products link */}
              <Link
                href="/urunler"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/urunler') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Ürünler
              </Link>

              {/* AI Assistant */}
              <Link
                href="/ai-asistan"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/ai-asistan') ? 'text-purple-700 bg-purple-50' : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Asistan
              </Link>

              {/* Cart */}
              <CartIcon />

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
                      <Link href="/hesabim/siparisler" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Package className="w-4 h-4 text-gray-400" /> Siparişlerim
                      </Link>
                      <Link href="/hesabim/favoriler" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Heart className="w-4 h-4 text-gray-400" /> Favorilerim
                      </Link>
                      <Link href="/hesabim/adresler" onClick={() => setIsAccountOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <MapPin className="w-4 h-4 text-gray-400" /> Adreslerim
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
              <CartIcon />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900"
                aria-label={isMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* ═══ Desktop Sub-bar: Categories + Brand Nav ═══ */}
          <div className="hidden lg:flex items-center gap-3 pb-2">
            <CategoryDropdown />
            <div className="h-5 w-px bg-gray-200" />
            <nav className="flex items-center gap-1">
              {[
                { href: '/parcalar', label: 'Parçalar' },
                { href: '/hakkimizda', label: 'Hakkımızda' },
                { href: '/iletisim', label: 'İletişim' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.href) ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
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
                { href: '/urunler', label: 'Ürünler', icon: ShoppingBag },
                { href: '/parcalar', label: 'Parçalar', icon: Package },
                { href: '/ai-asistan', label: 'AI Asistan', icon: Sparkles },
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

              {user ? (
                <>
                  <div className="h-px bg-gray-100 mx-2 my-1" />
                  <Link href="/hesabim/garaj" className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>
                    <Warehouse className="w-4 h-4" /> Garajım
                  </Link>
                  <Link href="/hesabim/siparisler" className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>
                    <Package className="w-4 h-4" /> Siparişlerim
                  </Link>
                  <Link href="/hesabim/favoriler" className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>
                    <Heart className="w-4 h-4" /> Favorilerim
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
      <BrandNavBar />
    </>
  )
}
