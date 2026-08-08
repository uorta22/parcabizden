'use client'

import { useEffect, useState, useCallback } from 'react'
import { FileText, MapPin, Phone, Building2 } from 'lucide-react'
import * as api from '@/lib/api'
import type { AdminSellerListItem, AdminSellerStatus, SellerStatus } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'

const STATUS_TABS: { value: AdminSellerStatus; label: string }[] = [
  { value: 'pending', label: 'Bekleyen' },
  { value: 'approved', label: 'Onaylı' },
  { value: 'rejected', label: 'Reddedilen' },
  { value: 'suspended', label: 'Askıda' },
  { value: 'all', label: 'Tümü' },
]

const STATUS_LABELS: Record<SellerStatus, string> = {
  pending: 'Beklemede',
  approved: 'Onaylı',
  suspended: 'Askıda',
  rejected: 'Reddedildi',
}

const STATUS_COLORS: Record<SellerStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  suspended: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
}

const EMPTY_MESSAGES: Record<AdminSellerStatus, string> = {
  pending: 'Bekleyen başvuru yok',
  approved: 'Onaylı mağaza yok',
  rejected: 'Reddedilen başvuru yok',
  suspended: 'Askıya alınmış mağaza yok',
  all: 'Kayıtlı satıcı yok',
}

type ReasonAction = 'rejected' | 'suspended'

export default function AdminSellersPage() {
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState<AdminSellerStatus>('pending')
  const [sellers, setSellers] = useState<AdminSellerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [decidingId, setDecidingId] = useState<number | null>(null)
  const [docLoadingId, setDocLoadingId] = useState<number | null>(null)

  // Reddet/Askıya al için açık gerekçe paneli — tek seferde tek satıcı için
  const [reasonPanel, setReasonPanel] = useState<{ sellerId: number; action: ReasonAction } | null>(null)
  const [reasonText, setReasonText] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.adminSellerList(statusFilter)
      setSellers(res.sellers)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Başvurular yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  function openReasonPanel(sellerId: number, action: ReasonAction) {
    setReasonPanel({ sellerId, action })
    setReasonText('')
  }

  function closeReasonPanel() {
    setReasonPanel(null)
    setReasonText('')
  }

  async function submitDecision(sellerId: number, decision: SellerStatus, reason?: string) {
    setDecidingId(sellerId)
    try {
      await api.adminSellerDecide(sellerId, decision as 'approved' | 'rejected' | 'suspended', reason)
      toast('Başvuru durumu güncellendi', 'success')
      closeReasonPanel()
      await load()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'İşlem gerçekleştirilemedi', 'error')
    } finally {
      setDecidingId(null)
    }
  }

  function handleApprove(sellerId: number) {
    submitDecision(sellerId, 'approved')
  }

  function handleReasonSubmit(sellerId: number, action: ReasonAction) {
    const trimmed = reasonText.trim()
    if (!trimmed) {
      toast('Gerekçe zorunlu', 'error')
      return
    }
    submitDecision(sellerId, action, trimmed)
  }

  async function handleViewDocument(sellerId: number) {
    setDocLoadingId(sellerId)
    try {
      const blob = await api.adminSellerDocument(sellerId)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      // Yeni sekme dosyayı yükleyene kadar URL'i canlı tut, sonra bellekten temizle
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Belge görüntülenemedi', 'error')
    } finally {
      setDocLoadingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Satıcı Başvuruları ({sellers.length})</h1>
        <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-center py-16 text-red-600 text-sm">{error}</p>
        ) : sellers.length === 0 ? (
          <p className="text-center py-16 text-gray-500 text-sm">{EMPTY_MESSAGES[statusFilter]}</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {sellers.map(seller => (
              <div key={seller.id} className="px-4 py-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">{seller.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[seller.status]}`}>
                        {STATUS_LABELS[seller.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {seller.owner_name} · {seller.owner_email}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">
                    {new Date(seller.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="mt-3 grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{seller.city_name}{seller.district_name ? ` / ${seller.district_name}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{seller.whatsapp}{seller.phone ? ` · ${seller.phone}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>Vergi No: {seller.tax_number || 'Belirtilmemiş'}</span>
                  </div>
                  {seller.address && (
                    <div className="sm:col-span-2 text-gray-500 text-xs mt-1">{seller.address}</div>
                  )}
                  {seller.rejection_reason && (
                    <div className="sm:col-span-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1.5 mt-1">
                      <strong>Gerekçe:</strong> {seller.rejection_reason}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleViewDocument(seller.id)}
                    disabled={!seller.has_document || docLoadingId === seller.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {docLoadingId === seller.id ? 'Yükleniyor…' : seller.has_document ? 'Vergi Levhasını Görüntüle' : 'Belge Yok'}
                  </button>

                  {seller.status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(seller.id)}
                      disabled={decidingId === seller.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      Onayla
                    </button>
                  )}
                  {seller.status !== 'rejected' && (
                    <button
                      onClick={() => openReasonPanel(seller.id, 'rejected')}
                      disabled={decidingId === seller.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      Reddet
                    </button>
                  )}
                  {seller.status !== 'suspended' && (
                    <button
                      onClick={() => openReasonPanel(seller.id, 'suspended')}
                      disabled={decidingId === seller.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50 transition-colors"
                    >
                      Askıya Al
                    </button>
                  )}
                  {decidingId === seller.id && (
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {reasonPanel?.sellerId === seller.id && (
                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      {reasonPanel.action === 'rejected' ? 'Red gerekçesi' : 'Askıya alma gerekçesi'} (zorunlu)
                    </label>
                    <textarea
                      value={reasonText}
                      onChange={e => setReasonText(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white"
                      placeholder="Satıcıya iletilecek gerekçeyi yazın…"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleReasonSubmit(seller.id, reasonPanel.action)}
                        disabled={decidingId === seller.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        Gönder
                      </button>
                      <button
                        onClick={closeReasonPanel}
                        disabled={decidingId === seller.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                      >
                        Vazgeç
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
