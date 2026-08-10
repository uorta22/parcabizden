'use client'

/**
 * Satıcı girişi — alıcı hesaplarından ayrı.
 *
 * account_type=seller ile giriş yapılır; alıcı hesabıyla girişte backend 403
 * döner ("Bu hesap bu panele ait degil"), bu mesaj describeSellerAuthError ile
 * anlaşılır Türkçeye çevrilir.
 *
 * Başarılı girişten sonra sert yönlendirme (window.location) yapılır — böylece
 * kök AuthProvider yeniden mount olup localStorage'daki token'ı okur.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, LogIn, Store } from 'lucide-react'
import { sellerLogin, describeSellerAuthError, SellerApiError } from '@/lib/seller'

export default function SellerGirisPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('E-posta ve şifre gerekli'); return }

    setIsLoading(true)
    try {
      await sellerLogin(email, password)
      window.location.href = '/'
    } catch (err) {
      const msg = err instanceof SellerApiError ? describeSellerAuthError(err.message) : 'Giriş başarısız'
      setError(msg)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10">
            <Store className="h-6 w-6 text-primary-500" />
          </div>
          <h1 className="text-2xl font-black text-white">Satıcı Girişi</h1>
          <p className="mt-2 text-sm text-gray-400">Mağazanı ve ilanlarını yönetmek için giriş yap</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/50 px-3 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="seller-login-email" className="mb-2 block text-sm font-medium text-gray-300">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <input
                  id="seller-login-email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="magaza@ornek.com"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 py-3 pl-12 pr-4 text-white placeholder-gray-500 transition-colors focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="seller-login-password" className="mb-2 block text-sm font-medium text-gray-300">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <input
                  id="seller-login-password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Şifreniz"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 py-3 pl-12 pr-4 text-white placeholder-gray-500 transition-colors focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit" disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-6 py-3.5 font-bold text-white transition-all hover:bg-primary-400 disabled:bg-primary-500/50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
              Giriş Yap
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Satıcı hesabınız yok mu?{' '}
            <Link href="/kayit" className="font-medium text-primary-500 hover:text-primary-400">Kayıt Ol</Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Bu, ParçaBizden alıcı hesabınızdan ayrı bir satıcı oturumudur.
        </p>
      </div>
    </div>
  )
}
