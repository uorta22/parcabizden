'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Mail, Lock, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function GirisPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('E-posta ve şifre gerekli')
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      router.push('/garaj')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Giriş Yap</span>
        </nav>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Giriş Yap</h1>
            <p className="text-gray-400">Garajınıza erişmek için giriş yapın</p>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="block text-gray-300 text-sm font-medium mb-2">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="w-full pl-12 pr-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-gray-300 text-sm font-medium mb-2">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifreniz"
                    className="w-full pl-12 pr-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-dark-900 font-semibold rounded-lg transition-all"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                Giriş Yap
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
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
