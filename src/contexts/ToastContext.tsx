'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { ToastContainer } from '@/components/Toast'
import type { ToastItem, ToastType } from '@/components/Toast'

// Context'in dışa açtığı arayüz — sadece toast() fonksiyonu yeterli
interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
})

// Aynı anda gösterilecek maksimum toast sayısı
const MAX_TOASTS = 5

// Otomatik kapanma süresi (ms)
const AUTO_DISMISS_MS = 3000

// Her toast için benzersiz kimlik üreteci
let counter = 0
function nextId(): number {
  counter += 1
  return counter
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  // Toast'ı listeden çıkar (manuel kapatma veya otomatik kapanma)
  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Yeni toast ekle; maksimum aşılıyorsa en eski olanı düşür
  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = nextId()

      setToasts((prev) => {
        const updated = [...prev, { id, message, type }]
        // Maksimum sayıyı aştıysa ilk (en eski) kaydı çıkar
        return updated.length > MAX_TOASTS ? updated.slice(updated.length - MAX_TOASTS) : updated
      })

      // 3 saniye sonra otomatik olarak kaldır
      setTimeout(() => remove(id), AUTO_DISMISS_MS)
    },
    [remove]
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast'lar layout dışında, fixed olarak render edilir */}
      <ToastContainer toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  )
}

// Bileşenlerde kullanılacak hook — örnek: const { toast } = useToast()
export function useToast(): ToastContextType {
  return useContext(ToastContext)
}
