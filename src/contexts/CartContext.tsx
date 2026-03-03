'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { CartItem } from '@/types/shop'
import { getWhatsAppUrl } from '@/lib/config'

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  getWhatsAppCartUrl: () => string
}

const CartContext = createContext<CartContextType | null>(null)

const CART_KEY = 'parcabizden_cart'

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CART_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    // storage full or unavailable
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setItems(loadCartFromStorage())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) saveCartToStorage(items)
  }, [items, mounted])

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === newItem.product_id)
      if (existing) {
        return prev.map(i =>
          i.product_id === newItem.product_id
            ? { ...i, quantity: i.quantity + (newItem.quantity || 1) }
            : i
        )
      }
      return [...prev, { ...newItem, quantity: newItem.quantity || 1 }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product_id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.product_id !== productId))
      return
    }
    setItems(prev =>
      prev.map(i => i.product_id === productId ? { ...i, quantity } : i)
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => i.has_price ? sum + i.unit_price * i.quantity : sum, 0)

  const getWhatsAppCartUrl = useCallback(() => {
    if (items.length === 0) return getWhatsAppUrl()

    const lines = items.map(i => {
      const priceStr = i.has_price
        ? `${i.unit_price.toLocaleString('tr-TR')} TL x ${i.quantity} = ${(i.unit_price * i.quantity).toLocaleString('tr-TR')} TL`
        : 'Fiyat Sorulacak'
      return `- ${i.product_name} (${i.quantity} adet) — ${priceStr}`
    })

    const pricedTotal = items
      .filter(i => i.has_price)
      .reduce((s, i) => s + i.unit_price * i.quantity, 0)

    const unpricedCount = items.filter(i => !i.has_price).length

    let msg = `Merhaba, aşağıdaki ürünler için sipariş oluşturmak istiyorum:\n\n${lines.join('\n')}`
    if (pricedTotal > 0) msg += `\n\nToplam: ${pricedTotal.toLocaleString('tr-TR')} TL`
    if (unpricedCount > 0) msg += `\n(${unpricedCount} ürün için fiyat bilgisi bekleniyor)`

    return getWhatsAppUrl(msg)
  }, [items])

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, totalPrice, getWhatsAppCartUrl
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
