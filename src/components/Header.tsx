'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Car, Phone, MessageCircle } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navLinks = [
    { href: '/', label: 'Ana Sayfa' },
    { href: '/parcalar', label: 'Parcalar' },
    { href: '/sase-sorgula', label: 'Sase Sorgula' },
    { href: '/hakkimizda', label: 'Hakkimizda' },
    { href: '/iletisim', label: 'Iletisim' },
  ]

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg gradient-accent flex items-center justify-center">
              <Car className="w-6 h-6 md:w-7 md:h-7 text-dark-900" />
            </div>
            <div>
              <span className="text-xl md:text-2xl font-bold text-white">
                Parca<span className="text-primary-500">Bizden</span>
              </span>
              <p className="text-[10px] md:text-xs text-gray-400 -mt-1">Yedek & Cikma Parca</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-primary-500 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Contact Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="tel:+905001234567"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-secondary-500 text-secondary-300 hover:bg-secondary-500/10 transition-all"
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">0500 123 45 67</span>
            </a>
            <a
              href="https://wa.me/905001234567?text=Merhaba,%20yedek%20parca%20hakkinda%20bilgi%20almak%20istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">WhatsApp</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-gray-300 hover:text-white"
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
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4 px-4">
                <a
                  href="tel:+905001234567"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-secondary-500 text-secondary-300"
                >
                  <Phone className="w-4 h-4" />
                  <span>0500 123 45 67</span>
                </a>
                <a
                  href="https://wa.me/905001234567?text=Merhaba,%20yedek%20parca%20hakkinda%20bilgi%20almak%20istiyorum."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-600 text-white"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp ile Ulasin</span>
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
