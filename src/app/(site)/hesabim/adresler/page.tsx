'use client'

import { useState, useEffect } from 'react'
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  Home,
} from 'lucide-react'
import { addressList, addressAdd, addressUpdate, addressRemove } from '@/lib/api'
import type { UserAddress } from '@/types/api'

const EMPTY_FORM: Omit<UserAddress, 'id'> = {
  title: '',
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  district: '',
  postal_code: '',
  is_default: false,
}

function AddressModal({
  address,
  onClose,
  onSave,
}: {
  address: UserAddress | null
  onClose: () => void
  onSave: (data: Omit<UserAddress, 'id'>) => Promise<void>
}) {
  const [form, setForm] = useState<Omit<UserAddress, 'id'>>(
    address ? { ...address } : { ...EMPTY_FORM }
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.full_name || !form.phone || !form.address_line1 || !form.city || !form.district || !form.postal_code) {
      setError('Lütfen zorunlu alanları doldurun.')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt sırasında hata oluştu.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {address ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adres Başlığı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Ev, İş, vb."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                placeholder="Alıcı adı soyadı"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Telefon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="0532 000 00 00"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adres Satırı 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.address_line1}
                onChange={(e) => set('address_line1', e.target.value)}
                placeholder="Mahalle, sokak, bina no, daire"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adres Satırı 2 <span className="text-xs text-gray-400 font-normal">(isteğe bağlı)</span>
              </label>
              <input
                type="text"
                value={form.address_line2 || ''}
                onChange={(e) => set('address_line2', e.target.value)}
                placeholder="Apartman, blok, kat vb."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                İl <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="İstanbul"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                İlçe <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.district}
                onChange={(e) => set('district', e.target.value)}
                placeholder="Kadıköy"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Posta Kodu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.postal_code}
                onChange={(e) => set('postal_code', e.target.value)}
                placeholder="34700"
                maxLength={10}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => set('is_default', !form.is_default)}
                  className={`w-10 h-6 rounded-full flex items-center transition-all ${form.is_default ? 'bg-primary-500' : 'bg-gray-200'}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.is_default ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">Varsayılan adres olarak ayarla</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/60 text-white font-semibold rounded-lg text-sm transition-all"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-lg text-sm transition-all"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdreslerPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editAddress, setEditAddress] = useState<UserAddress | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    addressList()
      .then((res) => setAddresses(res.addresses))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const handleSave = async (data: Omit<UserAddress, 'id'>) => {
    if (editAddress) {
      const res = await addressUpdate(editAddress.id, data)
      setAddresses((prev) => prev.map((a) => (a.id === editAddress.id ? res.address : a)))
      showSuccess('Adres güncellendi.')
    } else {
      const res = await addressAdd(data)
      setAddresses((prev) => [...prev, res.address])
      showSuccess('Yeni adres eklendi.')
    }
  }

  const handleSetDefault = async (id: number) => {
    const res = await addressUpdate(id, { is_default: true })
    setAddresses((prev) =>
      prev.map((a) => (a.id === id ? res.address : { ...a, is_default: false }))
    )
    showSuccess('Varsayılan adres güncellendi.')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu adresi silmek istediğinize emin misiniz?')) return
    await addressRemove(id)
    setAddresses((prev) => prev.filter((a) => a.id !== id))
    showSuccess('Adres silindi.')
  }

  const openAdd = () => {
    setEditAddress(null)
    setShowModal(true)
  }

  const openEdit = (address: UserAddress) => {
    setEditAddress(address)
    setShowModal(true)
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Adreslerim</h1>
          <p className="text-gray-500 text-sm">Kayıtlı teslimat adreslerinizi yönetin</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Adres Ekle</span>
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Kayıtlı Adres Yok</h2>
          <p className="text-gray-500 mb-6">Hızlı sipariş verebilmek için adres ekleyin.</p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            İlk Adresinizi Ekleyin
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`border rounded-xl p-5 transition-all ${
                address.is_default
                  ? 'border-primary-300 bg-primary-50/50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      address.is_default ? 'bg-primary-100' : 'bg-gray-100'
                    }`}
                  >
                    <Home
                      className={`w-4 h-4 ${address.is_default ? 'text-primary-500' : 'text-gray-400'}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm">{address.title}</h3>
                      {address.is_default && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                          <Star className="w-3 h-3" />
                          Varsayılan
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{address.full_name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {address.address_line1}
                      {address.address_line2 && `, ${address.address_line2}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {address.district}, {address.city} {address.postal_code}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{address.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      title="Varsayılan yap"
                      className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(address)}
                    title="Düzenle"
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    title="Sil"
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddressModal
          address={editAddress}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
