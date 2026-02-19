'use client'

import { MessageCircle } from 'lucide-react'
import { getWhatsAppUrl } from '@/lib/config'

export default function WhatsAppButton() {
  const whatsappUrl = getWhatsAppUrl()

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="WhatsApp ile iletişime geçin"
    >
      <div className="relative">
        {/* Pulse animation ring */}
        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25"></div>

        {/* Button */}
        <div className="relative w-14 h-14 md:w-16 md:h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-110">
          <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
        </div>

        {/* Tooltip */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg">
          WhatsApp ile yazın
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-gray-900"></div>
        </div>
      </div>
    </a>
  )
}
