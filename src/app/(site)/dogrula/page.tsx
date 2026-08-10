'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Mail, LogIn } from 'lucide-react'
import { verifyEmail, resendVerify } from '@/lib/api'

function DogrulaContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Doğrulama tokeni bulunamadı.')
      return
    }

    verifyEmail(token)
      .then((res) => {
        setStatus('success')
        setMessage(res.message || 'E-postanız başarıyla doğrulandı!')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Doğrulama başarısız oldu.')
      })
  }, [token])

  const handleResend = async () => {
    if (!resendEmail) return
    setResendStatus('loading')
    try {
      const res = await resendVerify(resendEmail)
      setResendStatus('sent')
      setResendMessage(res.message || 'Doğrulama e-postası gönderildi.')
    } catch (err) {
      setResendStatus('error')
      setResendMessage(err instanceof Error ? err.message : 'Gönderilemedi.')
    }
  }

  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center">
          {status === 'loading' && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">E-posta Doğrulanıyor...</h1>
              <p className="text-gray-500">Lütfen bekleyin.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Doğrulama Başarılı!</h1>
              <p className="text-gray-500 mb-6">{message}</p>
              <Link
                href="/giris"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all"
              >
                <LogIn className="w-5 h-5" />
                Giriş Yap
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Doğrulama Başarısız</h1>
              <p className="text-gray-500 mb-6">{message}</p>

              <div className="border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-600 mb-3">Yeni doğrulama e-postası almak için:</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="E-posta adresiniz"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleResend}
                    disabled={resendStatus === 'loading' || !resendEmail}
                    className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-all whitespace-nowrap"
                  >
                    {resendStatus === 'loading' ? 'Gönderiliyor...' : 'Tekrar Gönder'}
                  </button>
                </div>
                {resendMessage && (
                  <p className={`mt-2 text-sm ${resendStatus === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                    {resendMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DogrulaPage() {
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
      <DogrulaContent />
    </Suspense>
  )
}
