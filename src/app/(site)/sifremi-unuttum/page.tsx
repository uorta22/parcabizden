'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Mail, Send, CheckCircle } from 'lucide-react'
import { forgotPassword } from '@/lib/api'

export default function SifremiUnuttumPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('E-posta adresi gerekli')
      return
    }

    setIsLoading(true)
    try {
      await forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">E-posta Gönderildi!</h1>
              <p className="text-gray-500 mb-2">
                <span className="font-medium text-gray-700">{email}</span> adresine şifre sıfırlama linki gönderdik.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Lütfen e-postanızı kontrol edin. Link 1 saat geçerlidir.
              </p>
              <Link
                href="/giris"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all"
              >
                Giriş Sayfasına Dön
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
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/giris" className="hover:text-gray-900 transition-colors">Giriş Yap</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Şifremi Unuttum</span>
        </nav>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Şifremi Unuttum</h1>
            <p className="text-gray-500">E-posta adresinize şifre sıfırlama linki göndereceğiz</p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="forgot-email" className="block text-gray-700 text-sm font-medium mb-2">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
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
                  <Send className="w-5 h-5" />
                )}
                Sıfırlama Linki Gönder
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                Şifrenizi hatırladınız mı?{' '}
                <Link href="/giris" className="text-primary-500 hover:text-primary-400 font-medium">
                  Giriş Yap
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
