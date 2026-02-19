'use client'

import { useEffect, useState } from 'react'
import { X, Copy, Check, MessageCircle, Car } from 'lucide-react'
import { siteConfig } from '@/lib/config'
import type { VehiclePart } from '@/lib/api'

interface PartDetailModalProps {
  part: VehiclePart
  vehicleName: string
  categoryName?: string
  nodeName?: string
  onClose: () => void
}

export default function PartDetailModal({
  part,
  vehicleName,
  categoryName,
  nodeName,
  onClose,
}: PartDetailModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const copyOem = () => {
    navigator.clipboard.writeText(part.oem_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const whatsappMessage =
    `Merhaba, aşağıdaki parça için fiyat bilgisi almak istiyorum.\n\nParça: ${part.name}\nOEM No: ${part.oem_number}\nAraç: ${vehicleName}` +
    (categoryName ? `\nKategori: ${categoryName}` : '') +
    (nodeName ? `\nGrup: ${nodeName}` : '')

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/${siteConfig.phone.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`,
      '_blank',
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md animate-fadeIn overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Parça Detayı</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Part name */}
          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-1">{part.name}</h4>
            {categoryName && (
              <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                {categoryName}
                {nodeName && ` / ${nodeName}`}
              </span>
            )}
          </div>

          {/* OEM number */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">OEM Numarası</p>
            <button
              onClick={copyOem}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700 hover:border-primary-400 hover:text-gray-900 transition-all"
            >
              <span className="tracking-wider">{part.oem_number}</span>
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>

          {/* Vehicle info */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-primary-500/5 border border-primary-500/15 rounded-lg">
            <Car className="w-4 h-4 text-primary-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">{vehicleName}</span>
          </div>

          {/* WhatsApp CTA */}
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp ile Fiyat Al
          </button>

          <p className="text-xs text-gray-400 text-center">
            Esc tuşu veya dışarı tıklayarak kapatabilirsiniz
          </p>
        </div>
      </div>
    </div>
  )
}
