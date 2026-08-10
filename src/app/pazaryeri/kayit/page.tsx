'use client'

/**
 * Satıcı kaydı — account_type=seller ile ayrı bir hesap oluşturur.
 * Kayıt sonrası doğrudan mağaza başvurusuna yönlendirilir; sıradaki adım
 * satıcının vergi levhasını yükleyip mağazasını açması.
 */

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, User, Phone, UserPlus, Store } from 'lucide-react'
import { sellerRegister, SellerApiError } from '@/lib/seller'

export default function SellerKayitPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !password) { setError('Ad, e-posta ve şifre gerekli'); return }
    if (password.length < 8) { setError('Şifre en az 8 karakter olmalı'); return }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Şifre en az 1 büyük harf, 1 küçük harf ve 1 rakam içermeli')
      return
    }

    setIsLoading(true)
    try {
      await sellerRegister(email, password, name, phone || undefined)
      window.location.href = '/basvuru'
    } catch (err) {
      setError(err instanceof SellerApiError ? err.message : 'Kayıt başarısız')
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
          <h1 className="text-2xl font-black text-white">Satıcı Hesabı Aç</h1>
          <p className="mt-2 text-sm text-gray-400">Ücretsiz ve komisyonsuz — hesabını aç, mağazanı kur</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/50 px-3 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="seller-name" className="mb-2 block text-sm font-medium text-gray-300">Ad Soyad</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <input
                  id="seller-name" type="text" value={name}
                  onChange={e => setName(e.target.value)} placeholder="Adınız Soyadınız"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 py-3 pl-12 pr-4 text-white placeholder-gray-500 transition-colors focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="seller-email" className="mb-2 block text-sm font-medium text-gray-300">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <input
                  id="seller-email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="magaza@ornek.com"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 py-3 pl-12 pr-4 text-white placeholder-gray-500 transition-colors focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="seller-phone" className="mb-2 block text-sm font-medium text-gray-300">Telefon (Opsiyonel)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <input
                  id="seller-phone" type="tel" value={phone}
                  onChange={e => setPhone(e.target.value)} placeholder="0500 000 00 00"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 py-3 pl-12 pr-4 text-white placeholder-gray-500 transition-colors focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="seller-password" className="mb-2 block text-sm font-medium text-gray-300">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <input
                  id="seller-password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="En az 8 karakter (büyük harf, küçük harf, rakam)"
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
                <UserPlus className="h-5 w-5" />
              )}
              Kayıt Ol
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Zaten satıcı hesabınız var mı?{' '}
            <Link href="/giris" className="font-medium text-primary-500 hover:text-primary-400">Giriş Yap</Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Bu, ParçaBizden alıcı hesabınızdan ayrı bir satıcı oturumudur.
        </p>
      </div>
    </div>
  )
}
