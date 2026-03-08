'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

// Gösterilecek sayfa numaralarını hesapla (max 5 adet, aralarda ... ile)
function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = []

  // Her zaman ilk sayfayı göster
  pages.push(1)

  if (currentPage <= 3) {
    // Başa yakınsa: 1 2 3 4 ... son
    pages.push(2, 3, 4, 'ellipsis', totalPages)
  } else if (currentPage >= totalPages - 2) {
    // Sona yakınsa: 1 ... son-3 son-2 son-1 son
    pages.push('ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
  } else {
    // Ortadaysa: 1 ... önceki mevcut sonraki ... son
    pages.push('ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages)
  }

  return pages
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)

  const isFirst = currentPage === 1
  const isLast = currentPage === totalPages

  // Aktif sayfa butonu stili
  const activeStyle = 'bg-primary-500 text-dark-900 font-semibold border border-primary-500'
  // Pasif sayfa butonu stili
  const inactiveStyle = 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
  // Devre dışı buton stili
  const disabledStyle = 'opacity-50 cursor-not-allowed'
  // Ortak buton stili
  const baseBtn = 'inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm transition-colors'

  return (
    <nav aria-label="Sayfalama" className="flex items-center justify-center mt-8">

      {/* Mobil görünüm: Sadece önceki / mevcut bilgi / sonraki */}
      <div className="flex items-center gap-3 sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirst}
          aria-label="Önceki sayfa"
          className={`${baseBtn} ${inactiveStyle} ${isFirst ? disabledStyle : ''}`}
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-sm text-gray-600 min-w-[80px] text-center">
          <span className="font-semibold text-dark-900">{currentPage}</span>
          <span className="mx-1">/</span>
          {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast}
          aria-label="Sonraki sayfa"
          className={`${baseBtn} ${inactiveStyle} ${isLast ? disabledStyle : ''}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Masaüstü görünüm: Tam sayfalama */}
      <div className="hidden sm:flex items-center gap-1">

        {/* İlk sayfa butonu */}
        <button
          onClick={() => onPageChange(1)}
          disabled={isFirst}
          aria-label="İlk sayfa"
          className={`${baseBtn} ${inactiveStyle} ${isFirst ? disabledStyle : ''}`}
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Önceki sayfa butonu */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirst}
          aria-label="Önceki sayfa"
          className={`${baseBtn} ${inactiveStyle} ${isFirst ? disabledStyle : ''}`}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Sayfa numaraları ve ellipsis */}
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex items-center justify-center w-9 h-9 text-sm text-gray-400 select-none"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              aria-label={`Sayfa ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
              className={`${baseBtn} ${page === currentPage ? activeStyle : inactiveStyle}`}
            >
              {page}
            </button>
          )
        )}

        {/* Sonraki sayfa butonu */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast}
          aria-label="Sonraki sayfa"
          className={`${baseBtn} ${inactiveStyle} ${isLast ? disabledStyle : ''}`}
        >
          <ChevronRight size={16} />
        </button>

        {/* Son sayfa butonu */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={isLast}
          aria-label="Son sayfa"
          className={`${baseBtn} ${inactiveStyle} ${isLast ? disabledStyle : ''}`}
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </nav>
  )
}
