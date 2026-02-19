'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Car, Phone, MessageCircle, LogIn, User, LogOut, Warehouse } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getWhatsAppUrl } from '@/lib/config'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const handleNavClick = (href: string) => {
    if (pathname === href) {
      window.dispatchEvent(new CustomEvent('page-reset'))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const navLinks = [
    { href: '/', label: 'Ana Sayfa' },
    { href: '/parcalar', label: 'Parçalar' },
    { href: '/sase-sorgula', label: 'Şase Sorgula' },
    { href: '/hakkimizda', label: 'Hakkımızda' },
    { href: '/iletisim', label: 'İletişim' },
  ]

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" onClick={() => handleNavClick('/')} className="flex items-center gap-2 group">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg gradient-accent flex items-center justify-center">
              <Car className="w-6 h-6 md:w-7 md:h-7 text-dark-900" />
            </div>
            <div>
              <span className="text-xl md:text-2xl font-bold text-white">
                Parça<span className="text-primary-500">Bizden</span>
              </span>
              <p className="text-[10px] md:text-xs text-gray-400 -mt-1">Yedek & Çıkma Parça</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-gray-300 hover:text-primary-500 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/garaj"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-500 text-primary-500 hover:bg-primary-500/10 transition-all"
                >
                  <Warehouse className="w-4 h-4" />
                  <span className="text-sm font-medium">Garajım</span>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">{user.name}</span>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Çıkış Yap"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/giris"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-secondary-500 text-secondary-300 hover:bg-secondary-500/10 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="text-sm font-medium">Giriş Yap</span>
                </Link>
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </a>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-gray-300 hover:text-white"
            aria-label={isMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-dark-700 animate-fadeIn">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-3 text-gray-300 hover:text-primary-500 hover:bg-dark-800 rounded-lg transition-all"
                  onClick={() => { handleNavClick(link.href); setIsMenuOpen(false) }}
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <>
                  <Link
                    href="/garaj"
                    className="px-4 py-3 text-primary-500 hover:bg-dark-800 rounded-lg transition-all font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Garajım
                  </Link>
                  <button
                    onClick={() => { logout(); setIsMenuOpen(false) }}
                    className="px-4 py-3 text-left text-red-400 hover:bg-dark-800 rounded-lg transition-all"
                  >
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-4 px-4">
                  <Link
                    href="/giris"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-secondary-500 text-secondary-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Giriş Yap</span>
                  </Link>
                  <a
                    href={getWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-600 text-white"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp ile Ulaşın</span>
                  </a>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
