'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, AlertTriangle, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react'
import { changePassword, deleteAccount } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export default function AyarlarPage() {
  const { logout } = useAuth()

  // Change password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [passwordMsg, setPasswordMsg] = useState('')

  // Notification toggles
  const [notifOrder, setNotifOrder] = useState(true)
  const [notifPromo, setNotifPromo] = useState(false)
  const [notifMaintenance, setNotifMaintenance] = useState(true)

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [deleteMsg, setDeleteMsg] = useState('')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus('error')
      setPasswordMsg('Lütfen tüm şifre alanlarını doldurun.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordStatus('error')
      setPasswordMsg('Yeni şifre en az 6 karakter olmalıdır.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus('error')
      setPasswordMsg('Yeni şifreler eşleşmiyor.')
      return
    }

    setPasswordStatus('loading')
    try {
      const res = await changePassword(currentPassword, newPassword)
      if (res.success) {
        setPasswordStatus('success')
        setPasswordMsg(res.message || 'Şifreniz başarıyla değiştirildi.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordStatus('idle'), 4000)
      } else {
        throw new Error(res.message || 'Şifre değiştirilemedi.')
      }
    } catch (err) {
      setPasswordStatus('error')
      setPasswordMsg(err instanceof Error ? err.message : 'Şifre değiştirilemedi.')
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteStatus('error')
      setDeleteMsg('Hesabınızı silmek için şifrenizi girin.')
      return
    }
    setDeleteStatus('loading')
    try {
      await deleteAccount(deletePassword)
      logout()
    } catch (err) {
      setDeleteStatus('error')
      setDeleteMsg(err instanceof Error ? err.message : 'Hesap silinemedi.')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Ayarlar</h1>
        <p className="text-gray-500 text-sm">Hesap güvenliği ve tercihlerinizi yönetin</p>
      </div>

      {/* ── Şifre Değiştir ── */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <Lock className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Şifre Değiştir</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          {passwordStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {passwordMsg}
            </div>
          )}
          {passwordStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {passwordMsg}
            </div>
          )}

          {/* Current password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mevcut Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Mevcut şifreniz"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Yeni Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm new password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Yeni Şifre (Tekrar)</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Yeni şifrenizi tekrar girin"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordStatus === 'loading'}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/60 text-white font-semibold rounded-lg transition-all text-sm"
          >
            {passwordStatus === 'loading' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {passwordStatus === 'loading' ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
          </button>
        </form>
      </section>

      {/* ── Bildirim Tercihleri ── */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <AlertTriangle className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Bildirim Tercihleri</h2>
        </div>

        <div className="space-y-4 max-w-md">
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Bildirim tercihleri yakında aktif olacaktır.
          </p>
          <Toggle
            label="Sipariş Bildirimleri"
            description="Sipariş durumu güncellemeleri hakkında bildirim alın"
            value={notifOrder}
            onChange={setNotifOrder}
          />
          <Toggle
            label="Bakım Hatırlatmaları"
            description="Araç bakım zamanı geldiğinde bildirim alın"
            value={notifMaintenance}
            onChange={setNotifMaintenance}
          />
          <Toggle
            label="Kampanya ve İndirimler"
            description="Özel teklifler ve promosyonlardan haberdar olun"
            value={notifPromo}
            onChange={setNotifPromo}
          />
        </div>
      </section>

      {/* ── Hesap Sil (Danger Zone) ── */}
      <section>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-100">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <h2 className="text-base font-semibold text-red-600">Hesabı Sil</h2>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-sm text-red-700 mb-4">
            Hesabınızı sildiğinizde tüm verileriniz (garaj, siparişler, adresler) kalıcı olarak
            silinecektir. Bu işlem geri alınamaz.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition-all"
            >
              <ShieldAlert className="w-4 h-4" />
              Hesabımı Sil
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-700">
                Devam etmek için şifrenizi girin:
              </p>

              {deleteStatus === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {deleteMsg}
                </div>
              )}

              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Şifreniz"
                className="w-full max-w-sm px-3.5 py-2.5 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteStatus === 'loading'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg text-sm transition-all"
                >
                  {deleteStatus === 'loading' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  {deleteStatus === 'loading' ? 'Siliniyor...' : 'Hesabı Kalıcı Olarak Sil'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeletePassword('')
                    setDeleteStatus('idle')
                    setDeleteMsg('')
                  }}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-lg text-sm transition-all"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full flex items-center flex-shrink-0 transition-all mt-0.5 ${
          value ? 'bg-primary-500' : 'bg-gray-200'
        }`}
        role="switch"
        aria-checked={value}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
