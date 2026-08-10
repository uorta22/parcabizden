'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Mail, Lock, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { resendVerify } from '@/lib/api'

export default function GirisPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [resendMessage, setResendMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowResend(false)

    if (!email || !password) {
      setError('E-posta ve şifre gerekli')
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      router.push('/garaj')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Giriş başarısız'
      if (msg === 'email_not_verified' || msg.includes('dogrulayin') || msg.includes('doğrulayın')) {
        setError('Lütfen e-postanızı doğrulayın. Doğrulama linki e-posta adresinize gönderildi.')
        setShowResend(true)
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) { setResendMessage('Lütfen e-posta adresinizi girin.'); return }
    setResendStatus('loading')
    try {
      const res = await resendVerify(email)
      setResendStatus('sent')
      setResendMessage(res.message || 'Doğrulama e-postası gönderildi!')
    } catch (err) {
      setResendStatus('idle')
      setResendMessage(err instanceof Error ? err.message : 'Gönderilemedi.')
    }
  }

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Giriş Yap</span>
        </nav>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Giriş Yap</h1>
            <p className="text-gray-500">Garajınıza erişmek için giriş yapın</p>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                  {showResend && (
                    <div className="mt-3 pt-3 border-t border-red-100">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendStatus === 'loading'}
                        className="text-primary-500 hover:text-primary-600 font-medium underline text-sm"
                      >
                        {resendStatus === 'loading' ? 'Gönderiliyor...' : 'Doğrulama e-postasını tekrar gönder'}
                      </button>
                      {resendMessage && (
                        <p className={`mt-1 text-xs ${resendStatus === 'sent' ? 'text-green-600' : 'text-red-500'}`}>
                          {resendMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="block text-gray-700 text-sm font-medium mb-2">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-gray-700 text-sm font-medium mb-2">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifreniz"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              <div className="text-right">
                <Link href="/sifremi-unuttum" className="text-sm text-primary-500 hover:text-primary-400 transition-colors">
                  Şifremi Unuttum
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-semibold rounded-lg transition-all"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                Giriş Yap
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                Hesabınız yok mu?{' '}
                <Link href="/kayit" className="text-primary-500 hover:text-primary-400 font-medium">
                  Kayıt Ol
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
