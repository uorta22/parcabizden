'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { CategoryIcon } from '@/components/CategoryIcons'

const CATEGORIES = [
  { id: 'engine', name: 'Motor', slug: 'engine' },
  { id: 'turbo_intake', name: 'Turbo & Emme', slug: 'turbo_intake' },
  { id: 'fuel', name: 'Yakıt Sistemi', slug: 'fuel' },
  { id: 'exhaust', name: 'Egzoz', slug: 'exhaust' },
  { id: 'transmission', name: 'Şanzıman', slug: 'transmission' },
  { id: 'brake', name: 'Fren', slug: 'brake' },
  { id: 'suspension', name: 'Süspansiyon', slug: 'suspension' },
  { id: 'wheel_tyre', name: 'Jant & Lastik', slug: 'wheel_tyre' },
  { id: 'body_exterior', name: 'Kaporta & Dış', slug: 'body_exterior' },
  { id: 'glass_mirror', name: 'Cam & Ayna', slug: 'glass_mirror' },
  { id: 'lighting', name: 'Aydınlatma', slug: 'lighting' },
  { id: 'electrical', name: 'Elektrik', slug: 'electrical' },
  { id: 'climate', name: 'Klima & Isıtma', slug: 'climate' },
  { id: 'interior', name: 'İç Aksam', slug: 'interior' },
  { id: 'audio_media', name: 'Ses & Medya', slug: 'audio_media' },
  { id: 'tow_transport', name: 'Çeki & Taşıma', slug: 'tow_transport' },
  { id: 'other', name: 'Diğer', slug: 'other' },
]

export default function CategoryDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          isOpen ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Kategoriler
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full pt-1 w-[520px] z-50"
          onMouseLeave={() => setIsOpen(false)}
        >
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl py-3 animate-fadeIn">
          <div className="grid grid-cols-2 gap-0.5">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                href={`/urunler?cat=${cat.slug}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 rounded-lg transition-colors mx-1"
              >
                <CategoryIcon id={cat.id} className="text-gray-400" size={18} stroke={2} />
                <span className="text-sm text-gray-700 font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
