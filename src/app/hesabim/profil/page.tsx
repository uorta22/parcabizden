'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, Save, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getProfileFull, profileUpdate } from '@/lib/api'
import type { UserProfile } from '@/types/api'

export default function ProfilPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [gsm, setGsm] = useState('')

  useEffect(() => {
    if (!user) return
    getProfileFull()
      .then((p) => {
        setProfile(p)
        setName(p.name || '')
        setPhone(p.phone || '')
        setGsm(p.gsm || '')
      })
      .catch(() => {
        setName(user.name || '')
        setPhone(user.phone || '')
      })
      .finally(() => setIsLoading(false))
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setStatus('error')
      setErrorMsg('Ad Soyad alanı zorunludur.')
      return
    }
    setIsSaving(true)
    setStatus('idle')
    try {
      const res = await profileUpdate({ name: name.trim(), phone: phone.trim(), gsm: gsm.trim() })
      setProfile(res.user)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Profil güncellenemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Profil Bilgilerim</h1>
        <p className="text-gray-500 text-sm">Kişisel bilgilerinizi güncelleyin</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
        <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-2xl">
            {(profile?.name || user?.name || '?').charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{profile?.name || user?.name}</p>
          <p className="text-sm text-gray-500">{profile?.email || user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Profil bilgileriniz başarıyla güncellendi.
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Ad Soyad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ad Soyad <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adınız Soyadınız"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* E-posta (readonly) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            E-posta <span className="text-xs text-gray-400 font-normal">(değiştirilemez)</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="email"
              value={profile?.email || user?.email || ''}
              readOnly
              disabled
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0212 000 00 00"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Sabit hat numaranız</p>
        </div>

        {/* GSM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">GSM</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={gsm}
              onChange={(e) => setGsm(e.target.value)}
              placeholder="0532 000 00 00"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Cep telefonu numaranız</p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/60 text-white font-semibold rounded-lg transition-all text-sm"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}
