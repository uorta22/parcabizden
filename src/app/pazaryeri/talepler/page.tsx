'use client'

/**
 * Gelen Talepler — satıcıya dağıtılan alıcı talepleri ve teklif formu.
 *
 * Her talebin birden çok satırı (items) olabilir; satıcı her satıra ayrı
 * teklif verir. Aynı satıra ikinci teklif backend'de 409 ile reddedilir
 * (uq_offer_once) — bu durum "zaten teklif verdiniz" olarak gösterilip form
 * o satır için kilitlenir.
 */

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Inbox, Loader2, MapPin } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import RequireApprovedSeller from '../_components/RequireApprovedSeller'
import {
  fetchSellerRequests, createOffer, SellerApiError,
  type SellerRequest, type SellerRequestItem,
} from '@/lib/seller'
import type { ConditionType } from '@/lib/listings'

export default function TaleplerPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Gelen Talepler</h1>
        <p className="mt-1 text-sm text-gray-500">Sana iletilen alıcı talepleri ve satır bazlı teklif formu.</p>
      </header>

      <RequireApprovedSeller>{() => <RequestList />}</RequireApprovedSeller>
    </main>
  )
}

function RequestList() {
  const [requests, setRequests] = useState<SellerRequest[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSellerRequests()
      .then(r => setRequests(r.requests))
      .catch(err => setError(err instanceof Error ? err.message : 'Talepler yüklenemedi'))
  }, [])

  if (error) return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
  if (requests === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }
  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center">
        <Inbox className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="text-gray-500">Henüz sana iletilmiş bir talep yok.</p>
      </div>
    )
  }

  // Hiç teklif vermediğin talepler öne çıksın.
  const sorted = [...requests].sort((a, b) => Number(a.my_offer_count > 0) - Number(b.my_offer_count > 0))

  return (
    <div className="space-y-4">
      {sorted.map(req => <RequestCard key={req.id} request={req} />)}
    </div>
  )
}

function RequestCard({ request }: { request: SellerRequest }) {
  const answered = request.my_offer_count > 0
  return (
    <div className={`rounded-2xl border p-4 ${answered ? 'border-gray-200 bg-gray-50/60' : 'border-gray-200 bg-white'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-900">{request.vehicle_label || 'Araç belirtilmemiş'}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {request.city_name && (
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {request.city_name}</span>
            )}
            {request.vin && <span>Şase: {request.vin}</span>}
            {request.budget_max && <span>Bütçe: {Number(request.budget_max).toLocaleString('tr-TR')} ₺</span>}
          </div>
        </div>
        {answered ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
            <CheckCircle2 className="h-3 w-3" /> Teklif verdin ({request.my_offer_count})
          </span>
        ) : (
          <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-600">Yanıt bekliyor</span>
        )}
      </div>

      <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
        {request.items.map(item => <RequestItemRow key={item.id} item={item} />)}
      </div>
    </div>
  )
}

function RequestItemRow({ item }: { item: SellerRequestItem }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [alreadyOffered, setAlreadyOffered] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const [price, setPrice] = useState('')
  const [condition, setCondition] = useState<ConditionType | ''>('')
  const [warrantyDays, setWarrantyDays] = useState('')
  const [shipsInDays, setShipsInDays] = useState('')
  const [shippingPayer, setShippingPayer] = useState<'buyer' | 'seller' | 'negotiable'>('buyer')
  const [note, setNote] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!price || !condition) { setFormError('Fiyat ve parça durumu zorunlu'); return }
    setFormError('')
    setSubmitting(true)
    try {
      await createOffer({
        request_item_id: item.id,
        price,
        condition_type: condition,
        warranty_days: warrantyDays ? Number(warrantyDays) : undefined,
        ships_in_days: shipsInDays ? Number(shipsInDays) : undefined,
        shipping_payer: shippingPayer,
        note: note.trim() || undefined,
      })
      setSent(true)
      setOpen(false)
      toast('Teklifin gönderildi', 'success')
    } catch (err) {
      if (err instanceof SellerApiError && err.status === 409) {
        setAlreadyOffered(true)
        setOpen(false)
        toast('Bu satıra zaten teklif verdiniz', 'error')
      } else {
        setFormError(err instanceof Error ? err.message : 'Teklif gönderilemedi')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const locked = sent || alreadyOffered

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{item.part_label} <span className="text-gray-400">× {item.quantity}</span></p>
          {item.oem_number && <p className="text-xs text-gray-400">OEM: {item.oem_number}</p>}
          {item.note && <p className="text-xs text-gray-500">{item.note}</p>}
        </div>
        {locked ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500">
            <CheckCircle2 className="h-3 w-3" /> Bu satıra zaten teklif verdiniz
          </span>
        ) : (
          <button
            onClick={() => setOpen(v => !v)}
            className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-400"
          >
            {open ? 'Vazgeç' : 'Teklif Ver'}
          </button>
        )}
      </div>

      {open && !locked && (
        <form onSubmit={submit} className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">Fiyat (₺) *</span>
              <input
                value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" placeholder="Örn. 850"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">Parça durumu *</span>
              <select
                value={condition} onChange={e => setCondition(e.target.value as ConditionType)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="">Seçin</option>
                <option value="cikma">Çıkma</option>
                <option value="sifir">Sıfır</option>
                <option value="yenilenmis">Yenilenmiş</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">Garanti (gün)</span>
              <input
                value={warrantyDays} onChange={e => setWarrantyDays(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">Teslim (gün)</span>
              <input
                value={shipsInDays} onChange={e => setShipsInDays(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Örn. 2"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">Kargo</span>
              <select
                value={shippingPayer} onChange={e => setShippingPayer(e.target.value as 'buyer' | 'seller' | 'negotiable')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="buyer">Alıcı öder</option>
                <option value="seller">Satıcı öder</option>
                <option value="negotiable">Pazarlık edilir</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Not (opsiyonel)</span>
            <textarea
              value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={500}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              placeholder="Alıcıya iletmek istediğin detay"
            />
          </label>

          {formError && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-red-600"><AlertCircle className="h-3.5 w-3.5" /> {formError}</p>
          )}

          <button
            type="submit" disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-bold text-white hover:bg-primary-400 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Teklifi Gönder
          </button>
        </form>
      )}
    </div>
  )
}
