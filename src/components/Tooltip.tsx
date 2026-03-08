import React from 'react'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content: string
  position?: TooltipPosition
  children: React.ReactNode
}

// Konuma göre tooltip yerleşim sınıfları
const positionClasses: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

// Konuma göre ok/caret sınıfları — CSS border trick ile üçgen
const arrowClasses: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
  left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
  right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900',
}

export default function Tooltip({
  content,
  position = 'top',
  children,
}: TooltipProps) {
  return (
    // Grup sarmalayıcı — hover/focus-within ile tooltip tetiklenir
    <span className="relative inline-flex group">
      {children}

      {/* Tooltip balonu — pointer-events-none ile tıklamayı engelle */}
      <span
        role="tooltip"
        className={[
          'absolute z-40 pointer-events-none',
          'bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap',
          'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
          'transition-opacity duration-150',
          positionClasses[position],
        ].join(' ')}
      >
        {content}

        {/* Ok işareti — CSS border üçgeni */}
        <span
          className={[
            'absolute w-0 h-0 border-4',
            arrowClasses[position],
          ].join(' ')}
        />
      </span>
    </span>
  )
}
