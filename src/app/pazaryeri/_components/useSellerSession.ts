'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchMySeller, type SellerProfile } from '@/lib/api'

/**
 * Panel genelinde tekrarlanan durum: giriş yapmış kullanıcı + onun mağaza kaydı.
 * Alıcı sitesindeki useAuth() ile aynı oturumu okur (bkz. src/lib/seller.ts başlık notu).
 */
export function useSellerSession() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const [seller, setSeller] = useState<SellerProfile | null>(null)
  const [checkingSeller, setCheckingSeller] = useState(true)

  const refreshSeller = useCallback(() => {
    if (!user) {
      setSeller(null)
      setCheckingSeller(false)
      return Promise.resolve()
    }
    setCheckingSeller(true)
    return fetchMySeller()
      .then(r => setSeller(r.seller))
      .catch(() => setSeller(null))
      .finally(() => setCheckingSeller(false))
  }, [user])

  useEffect(() => {
    if (authLoading) return
    refreshSeller()
  }, [authLoading, refreshSeller])

  return { user, authLoading, seller, checkingSeller, refreshSeller, logout }
}
