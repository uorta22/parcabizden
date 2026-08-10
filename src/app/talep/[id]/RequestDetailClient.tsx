'use client'

/**
 * Talep detayı — sahibinin (ya da erişim anahtarını taşıyanın) teklifleri
 * satır bazında karşılaştırdığı ve karar verdiği sayfa.
 *
 * Backend: GET ?action=request_detail&id&t, POST ?action=offer_decide.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  Car, Clock, Loader2, AlertCircle, CheckCircle2, XCircle, PackageSearch, Phone, Wallet,
} from 'lucide-react'
import type { OfferRow, RequestDetail, RequestItemRow } from './_types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

const CONDITION_LABEL: Record<string, string> = { cikma: 'Çıkma', sifir: 'Sıfır', yenilenmis: 'Yenilenmiş' }
const SHIPPING_LABEL: Record<string, string> = { buyer: 'Alıcı öder', seller: 'Satıcı öder', negotiable: 'Görüşülür' }

function formatPrice(price: string): string {
  const n = Number(price)
  if (!Number.isFinite(n)) return price
  return n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 })
}

function formatResponseTime(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes < 60) return `~${Math.round(minutes)} dk`
  return `~${Math.round(minutes / 60)} sa`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

async function fetchDetail(id: string, token: string): Promise<RequestDetail> {
  const params = new URLSearchParams({ action: 'request_detail', id })
  if (token) params.set('t', token)

  const headers: Record<string, string> = {}
  if (typeof window !== 'undefined') {
    const auth = localStorage.getItem('token')
    if (auth) headers['Authorization'] = `Bearer ${auth}`
  }

  const res = await fetch(`${API_BASE}/?${params.toString()}`, { headers })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data || data.error) {
    throw new Error((data && data.error) || 'Talep bulunamadı')
  }
  return data.request as RequestDetail
}

async function decideOffer(offerId: number, decision: 'accepted' | 'rejected', token: string): Promise<void> {
  const params = new URLSearchParams({ offer_id: String(offerId), decision })
  if (token) params.set('t', token)

  const res = await fetch(`${API_BASE}/?action=offer_decide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' },
    body: params.toString(),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data || data.error) {
    throw new Error((data && data.error) || 'İşlem tamamlanamadı')
  }
}

export default function RequestDetailClient({ id, token }: { id: string; token: string }) {
  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [decidingOfferId, setDecidingOfferId] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetchDetail(id, token)
      .then(setRequest)
      .catch(err => setError(err instanceof Error ? err.message : 'Talep yüklenemedi'))
      .finally(() => setLoading(false))
  }, [id, token])

  useEffect(() => { load() }, [load])

  const handleDecide = async (offer: OfferRow, decision: 'accepted' | 'rejected') => {
    setDecidingOfferId(offer.id)
    try {
      await decideOffer(offer.id, decision, token)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem tamamlanamadı')
    } finally {
      setDecidingOfferId(null)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </main>
    )
  }

  if (error && !request) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-semibold text-gray-700">{error}</p>
        </div>
      </main>
    )
  }

  if (!request) return null

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                request.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {request.status === 'open' ? 'Açık' : 'Kapandı'}
              </span>
              <h1 className="mt-2 text-2xl font-black text-gray-900">Talep #{request.id}</h1>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>{formatDate(request.created_at)} oluşturuldu</p>
              <p>Son geçerlilik {formatDate(request.expires_at)}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            {request.vehicle_label && (
              <span className="flex items-center gap-1.5"><Car className="h-4 w-4 text-primary-500" /> {request.vehicle_label}</span>
            )}
            {request.vin && <span className="font-mono text-xs text-gray-400">Şase: {request.vin}</span>}
            <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary-500" /> {request.contact_phone}</span>
            {request.budget_max && (
              <span className="flex items-center gap-1.5"><Wallet className="h-4 w-4 text-primary-500" /> Bütçe: {formatPrice(request.budget_max)} altı</span>
            )}
          </div>
        </header>

        {error && (
          <p className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </p>
        )}

        <div className="space-y-6">
          {request.items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              offers={request.offers.filter(o => o.request_item_id === item.id)}
              deciding={decidingOfferId}
              onDecide={handleDecide}
              requestOpen={request.status === 'open'}
            />
          ))}
        </div>
      </div>
    </main>
  )
}

function ItemCard({
  item, offers, deciding, onDecide, requestOpen,
}: {
  item: RequestItemRow
  offers: OfferRow[]
  deciding: number | null
  onDecide: (offer: OfferRow, decision: 'accepted' | 'rejected') => void
  requestOpen: boolean
}) {
  const canDecide = requestOpen && item.status === 'open'

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            {item.part_label} <span className="font-normal text-gray-400">× {item.quantity}</span>
          </h2>
          {item.oem_number && <p className="text-xs text-gray-400">OEM: {item.oem_number}</p>}
          {item.note && <p className="mt-0.5 text-xs text-gray-500">{item.note}</p>}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
          item.status === 'open' ? 'bg-primary-50 text-primary-600' : 'bg-emerald-50 text-emerald-600'
        }`}>
          {item.status === 'open' ? `${offers.length} teklif` : 'Karar verildi'}
        </span>
      </div>

      {offers.length === 0 ? (
        <p className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-400">
          <PackageSearch className="h-4 w-4" /> Henüz teklif gelmedi
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                <th className="py-2 pr-3">Satıcı</th>
                <th className="py-2 pr-3">Fiyat</th>
                <th className="py-2 pr-3">Durum</th>
                <th className="py-2 pr-3">Garanti</th>
                <th className="py-2 pr-3">Teslim</th>
                <th className="py-2 pr-3">Kargo</th>
                <th className="py-2 pr-3">Yanıt süresi</th>
                {canDecide && <th className="py-2 pr-3 text-right">Karar</th>}
              </tr>
            </thead>
            <tbody>
              {offers.map(offer => (
                <tr key={offer.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-3">
                    <div className="font-semibold text-gray-900">{offer.seller_name}</div>
                    {offer.city_name && <div className="text-xs text-gray-400">{offer.city_name}</div>}
                  </td>
                  <td className="py-3 pr-3 font-bold text-gray-900">{formatPrice(offer.price)}</td>
                  <td className="py-3 pr-3 text-gray-600">{CONDITION_LABEL[offer.condition_type] ?? offer.condition_type}</td>
                  <td className="py-3 pr-3 text-gray-600">{offer.warranty_days > 0 ? `${offer.warranty_days} gün` : '—'}</td>
                  <td className="py-3 pr-3 text-gray-600">{offer.ships_in_days !== null ? `${offer.ships_in_days} gün` : '—'}</td>
                  <td className="py-3 pr-3 text-gray-600">{SHIPPING_LABEL[offer.shipping_payer] ?? offer.shipping_payer}</td>
                  <td className="py-3 pr-3 text-gray-600">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gray-400" /> {formatResponseTime(offer.median_response_minutes)}</span>
                  </td>
                  {canDecide && (
                    <td className="py-3 pr-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={deciding === offer.id}
                          onClick={() => onDecide(offer, 'accepted')}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-400 disabled:opacity-50"
                        >
                          {deciding === offer.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Kabul Et
                        </button>
                        <button
                          type="button"
                          disabled={deciding === offer.id}
                          onClick={() => onDecide(offer, 'rejected')}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reddet
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
