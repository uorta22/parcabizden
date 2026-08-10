'use client'

/**
 * Tekliflerim — satıcının gönderdiği tüm teklifler ve durumları.
 * Kabul edilmiş teklif geri çekilemez (backend 409 döner) — bu durumda
 * geri çekme butonu hiç gösterilmez.
 */

import { useEffect, useState } from 'react'
import { BadgeCheck, Loader2, Undo2 } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import RequireApprovedSeller from '../_components/RequireApprovedSeller'
import { fetchMyOffers, withdrawOffer, type SellerOffer, type OfferStatus } from '@/lib/seller'

const STATUS_LABELS: Record<OfferStatus, string> = {
  sent: 'Gönderildi',
  seen: 'Görüldü',
  accepted: 'Kabul Edildi',
  rejected: 'Reddedildi',
  withdrawn: 'Geri Çekildi',
  expired: 'Süresi Doldu',
}

const STATUS_COLORS: Record<OfferStatus, string> = {
  sent: 'bg-blue-100 text-blue-800',
  seen: 'bg-indigo-100 text-indigo-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-500',
  expired: 'bg-gray-100 text-gray-500',
}

export default function TekliflerimPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Tekliflerim</h1>
        <p className="mt-1 text-sm text-gray-500">Gönderdiğin tüm tekliflerin durumu.</p>
      </header>

      <RequireApprovedSeller>{() => <OfferList />}</RequireApprovedSeller>
    </main>
  )
}

function OfferList() {
  const { toast } = useToast()
  const [offers, setOffers] = useState<SellerOffer[] | null>(null)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState<number | null>(null)

  useEffect(() => {
    fetchMyOffers()
      .then(r => setOffers(r.offers))
      .catch(err => setError(err instanceof Error ? err.message : 'Teklifler yüklenemedi'))
  }, [])

  async function handleWithdraw(id: number) {
    setActingId(id)
    try {
      await withdrawOffer(id)
      setOffers(prev => prev && prev.map(o => o.id === id ? { ...o, status: 'withdrawn' } : o))
      toast('Teklifin geri çekildi', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Teklif geri çekilemedi', 'error')
    } finally {
      setActingId(null)
    }
  }

  if (error) return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
  if (offers === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }
  if (offers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center">
        <BadgeCheck className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="text-gray-500">Henüz bir teklif göndermedin.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {offers.map(offer => (
        <div key={offer.id} className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_COLORS[offer.status]}`}>
                  {STATUS_LABELS[offer.status]}
                </span>
                {offer.vehicle_label && <span className="text-xs text-gray-400">{offer.vehicle_label}</span>}
              </div>
              <h3 className="mt-1.5 truncate font-bold text-gray-900">{offer.part_label} <span className="text-gray-400 font-normal">× {offer.quantity}</span></h3>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="font-bold text-gray-900">{Number(offer.price).toLocaleString('tr-TR')} ₺</span>
                {offer.warranty_days > 0 && <span>{offer.warranty_days} gün garanti</span>}
                {offer.ships_in_days !== null && <span>{offer.ships_in_days} günde teslim</span>}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(offer.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {(offer.status === 'sent' || offer.status === 'seen') && (
              <button
                onClick={() => handleWithdraw(offer.id)}
                disabled={actingId === offer.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {actingId === offer.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
                Geri Çek
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
