'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, CheckCircle, XCircle, LogIn, Loader2 } from 'lucide-react'
import { resetPassword } from '@/lib/api'

function SifreSifirlaContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Geçersiz Link</h1>
              <p className="text-gray-500 mb-6">Şifre sıfırlama tokeni bulunamadı.</p>
              <Link
                href="/sifremi-unuttum"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all"
              >
                Yeni Link İste
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı')
      return
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Şifre en az 1 büyük harf, 1 küçük harf ve 1 rakam içermeli')
      return
    }
    if (password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor')
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(token, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Şifre sıfırlama başarısız')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Şifre Değiştirildi!</h1>
              <p className="text-gray-500 mb-6">Şifreniz başarıyla güncellendi. Artık giriş yapabilirsiniz.</p>
              <Link
                href="/giris"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all"
              >
                <LogIn className="w-5 h-5" />
                Giriş Yap
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni Şifre Belirle</h1>
            <p className="text-gray-500">Hesabınız için yeni bir şifre oluşturun</p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="new-password" className="block text-gray-700 text-sm font-medium mb-2">Yeni Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 8 karakter (büyük harf, küçük harf, rakam)"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-gray-700 text-sm font-medium mb-2">Şifre Tekrar</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirm-password"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Şifrenizi tekrar girin"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-semibold rounded-lg transition-all"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
                Şifremi Değiştir
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SifreSifirlaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center">
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                <h1 className="text-xl font-bold text-gray-900 mb-2">Yükleniyor...</h1>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SifreSifirlaContent />
    </Suspense>
  )
}
