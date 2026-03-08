'use client'

import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, type LucideIcon } from 'lucide-react'

// Toast tipini dışa aktar — Context tarafından kullanılır
export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

// Her tip için renk ve ikon eşleşmesi
const TOAST_VARIANTS: Record<
  ToastType,
  {
    containerClass: string
    iconClass: string
    Icon: LucideIcon
  }
> = {
  success: {
    containerClass:
      'bg-green-50 border-green-200 text-green-800',
    iconClass: 'text-green-500',
    Icon: CheckCircle2,
  },
  error: {
    containerClass:
      'bg-red-50 border-red-200 text-red-800',
    iconClass: 'text-red-500',
    Icon: AlertCircle,
  },
  info: {
    containerClass:
      'bg-blue-50 border-blue-200 text-blue-800',
    iconClass: 'text-blue-500',
    Icon: Info,
  },
  warning: {
    containerClass:
      'bg-amber-50 border-amber-200 text-amber-800',
    iconClass: 'text-amber-500',
    Icon: AlertTriangle,
  },
}

interface ToastCardProps {
  toast: ToastItem
  onClose: (id: number) => void
}

// Tek bir toast kartı — animasyon inline style ile sağlanır
function ToastCard({ toast, onClose }: ToastCardProps) {
  const variant = TOAST_VARIANTS[toast.type]
  const { Icon } = variant

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'flex items-start gap-3 w-full max-w-sm sm:max-w-xs',
        'border rounded-lg shadow-lg px-4 py-3',
        'animate-slide-in-right',
        variant.containerClass,
      ].join(' ')}
    >
      {/* Sol ikon */}
      <Icon size={20} className={`mt-0.5 shrink-0 ${variant.iconClass}`} />

      {/* Mesaj metni */}
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>

      {/* Kapatma butonu */}
      <button
        onClick={() => onClose(toast.id)}
        aria-label="Bildirimi kapat"
        className="shrink-0 ml-1 rounded hover:opacity-60 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onClose: (id: number) => void
}

// Tüm toast'ları sabit konumda üst-sağda yığan kapsayıcı
export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Bildirimler"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((item) => (
        <div key={item.id} className="pointer-events-auto w-full">
          <ToastCard toast={item} onClose={onClose} />
        </div>
      ))}
    </div>
  )
}
