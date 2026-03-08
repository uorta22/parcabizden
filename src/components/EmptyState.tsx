'use client'

import Link from 'next/link'

// EmptyState bileşeni için prop tanımları
interface EmptyStateProps {
  // Gösterilecek lucide ikonu (React elemanı olarak geçilir)
  icon: React.ReactNode
  // Ana başlık metni
  title: string
  // Opsiyonel açıklama metni
  description?: string
  // Opsiyonel aksiyon butonu — href varsa Link, onClick varsa button olarak render edilir
  action?: {
    label: string
    href?: string
    onClick?: () => void
    icon?: React.ReactNode
  }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    // Dikey ortalama — sayfanın boş durumlarında kullanılır
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* İkon alanı — gri yuvarlak zemin üzerinde */}
      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6 text-gray-400">
        {icon}
      </div>

      {/* Başlık */}
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>

      {/* Açıklama — opsiyonel */}
      {description && (
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">{description}</p>
      )}

      {/* Aksiyon — description yoksa margin üstten eklenir */}
      {action && (
        <div className={description ? '' : 'mt-4'}>
          {action.href ? (
            // href varsa Next.js Link bileşeni kullanılır
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-dark-900 text-sm font-semibold rounded-xl transition-colors"
            >
              {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
              {action.label}
            </Link>
          ) : action.onClick ? (
            // onClick varsa sıradan button kullanılır
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-dark-900 text-sm font-semibold rounded-xl transition-colors"
            >
              {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
              {action.label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
