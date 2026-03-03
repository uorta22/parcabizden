'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Car, LogIn, User, LogOut, Warehouse, Sparkles, UserPlus, ChevronDown, Search, ShoppingBag } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import CartIcon from '@/components/CartIcon'
import BrandNavBar from '@/components/BrandNavBar'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavClick = (href: string) => {
    if (pathname === href) {
      window.dispatchEvent(new CustomEvent('page-reset'))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

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

  const navLinks = [
    { href: '/', label: 'Ana Sayfa' },
    { href: '/urunler', label: 'Ürünler', shopIcon: true },
    { href: '/parcalar', label: 'Parçalar' },
    { href: '/ai-asistan', label: 'AI Asistan', icon: true },
    { href: '/hakkimizda', label: 'Hakkımızda' },
    { href: '/iletisim', label: 'İletişim' },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 glass">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            {/* Logo */}
            <Link href="/" onClick={() => handleNavClick('/')} className="flex items-center gap-2 group flex-shrink-0">
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

            {/* Desktop Search Bar */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ürün veya OEM numarası ara..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                />
              </div>
            </form>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    link.icon
                      ? `flex items-center gap-1.5 ${isActive(link.href) ? 'text-purple-700 bg-purple-50' : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50/50'}`
                      : link.shopIcon
                        ? `flex items-center gap-1.5 ${isActive(link.href) ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`
                        : isActive(link.href)
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.icon && <Sparkles className="w-3.5 h-3.5" />}
                  {link.shopIcon && <ShoppingBag className="w-3.5 h-3.5" />}
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-current rounded-full" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Side Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <CartIcon />
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 animate-fadeIn">
                      <Link
                        href="/garaj"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Warehouse className="w-4 h-4 text-gray-400" />
                        Garajım
                      </Link>
                      <div className="h-px bg-gray-100 mx-2" />
                      <button
                        onClick={() => { logout(); setIsDropdownOpen(false) }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
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

          {/* Mobile Menu */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="py-4 border-t border-gray-200">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-3 px-4">
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
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                      link.icon
                        ? `flex items-center gap-2 ${isActive(link.href) ? 'text-purple-700 bg-purple-50' : 'text-purple-600 hover:bg-purple-50'}`
                        : link.shopIcon
                          ? `flex items-center gap-2 ${isActive(link.href) ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`
                          : isActive(link.href)
                            ? 'text-primary-600 bg-primary-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => { handleNavClick(link.href); setIsMenuOpen(false) }}
                  >
                    {link.icon && <Sparkles className="w-4 h-4" />}
                    {link.shopIcon && <ShoppingBag className="w-4 h-4" />}
                    {link.label}
                  </Link>
                ))}

                {user ? (
                  <>
                    <div className="h-px bg-gray-100 mx-2 my-1" />
                    <Link
                      href="/garaj"
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                        isActive('/garaj') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Warehouse className="w-4 h-4" />
                      Garajım
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
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 mt-3 px-4">
                    <Link
                      href="/giris"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LogIn className="w-4 h-4" />
                      Giriş Yap
                    </Link>
                    <Link
                      href="/kayit"
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary-500 text-white text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <UserPlus className="w-4 h-4" />
                      Kayıt Ol
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </div>
      </header>
      <BrandNavBar />
    </>
  )
}
