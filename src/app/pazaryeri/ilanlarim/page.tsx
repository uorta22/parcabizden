'use client'

/**
 * İlanlarım — satıcının kendi ilan listesi.
 *
 * Tazelik teyidi bu ürünün ayırt edici özelliği: rakiplerde satış WhatsApp'ta
 * kapandığı için ilan bayatlıyor, envanterin ne kadarının hâlâ geçerli olduğu
 * bilinmiyor. Bu yüzden süresi dolmak üzere olan aktif ilanlar listenin en
 * üstünde, uyarılı bir kartla ve göze çarpan "Hâlâ var" butonuyla gösterilir.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Loader2, Package, RefreshCw, Tag } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import RequireApprovedSeller from '../_components/RequireApprovedSeller'
import {
  fetchMyListings, confirmListing, setListingStatus, listingImageUrl,
  type SellerListing, type ListingStatus,
} from '@/lib/seller'

const URGENT_MS = 5 * 24 * 60 * 60 * 1000

const STATUS_LABELS: Record<ListingStatus, string> = {
  draft: 'Taslak',
  pending_review: 'Onay Bekliyor',
  active: 'Yayında',
  reserved: 'Ayrıldı',
  sold: 'Satıldı',
  expired: 'Süresi Doldu',
  removed: 'Kaldırıldı',
}

const STATUS_COLORS: Record<ListingStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_review: 'bg-amber-100 text-amber-800',
  active: 'bg-green-100 text-green-800',
  reserved: 'bg-blue-100 text-blue-800',
  sold: 'bg-gray-200 text-gray-800',
  expired: 'bg-red-100 text-red-800',
  removed: 'bg-gray-100 text-gray-500',
}

function isUrgent(listing: SellerListing): boolean {
  if (listing.status !== 'active' || !listing.expires_at) return false
  return new Date(listing.expires_at).getTime() - Date.now() < URGENT_MS
}

function daysLeftLabel(expiresAt: string | null): string {
  if (!expiresAt) return ''
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return 'Süresi doldu'
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000))
  if (days <= 1) return 'Bugün doluyor'
  return `${days} gün kaldı`
}

function formatPrice(listing: SellerListing): string {
  if (listing.price) return `${Number(listing.price).toLocaleString('tr-TR')} ₺`
  if (listing.price_min && listing.price_max) {
    return `${Number(listing.price_min).toLocaleString('tr-TR')} – ${Number(listing.price_max).toLocaleString('tr-TR')} ₺`
  }
  return 'Fiyat belirtilmemiş'
}

export default function IlanlarimPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">İlanlarım</h1>
          <p className="mt-1 text-sm text-gray-500">Yayındaki ve geçmiş ilanlarını yönet.</p>
        </div>
        <Link href="/ilan-ver" className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-bold text-white hover:bg-primary-400">
          Yeni İlan Ver
        </Link>
      </header>

      <RequireApprovedSeller>{() => <ListingList />}</RequireApprovedSeller>
    </main>
  )
}

function ListingList() {
  const { toast } = useToast()
  const [listings, setListings] = useState<SellerListing[] | null>(null)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState<number | null>(null)

  const load = () => {
    fetchMyListings()
      .then(r => setListings(r.listings))
      .catch(err => setError(err instanceof Error ? err.message : 'İlanlar yüklenemedi'))
  }

  useEffect(() => { load() }, [])

  async function handleConfirm(id: number) {
    setActingId(id)
    try {
      const res = await confirmListing(id)
      setListings(prev => prev && prev.map(l => l.id === id
        ? { ...l, expires_at: res.expires_at, last_confirmed_at: new Date().toISOString(), status: l.status === 'expired' ? 'active' : l.status }
        : l))
      toast('İlan hâlâ var olarak işaretlendi, süresi uzatıldı', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'İşlem başarısız oldu', 'error')
    } finally {
      setActingId(null)
    }
  }

  async function handleStatus(id: number, status: 'active' | 'reserved' | 'sold' | 'removed') {
    setActingId(id)
    try {
      await setListingStatus(id, status)
      setListings(prev => prev && prev.map(l => l.id === id ? { ...l, status } : l))
      toast('İlan durumu güncellendi', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'İşlem başarısız oldu', 'error')
    } finally {
      setActingId(null)
    }
  }

  if (error) return <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
  if (listings === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }
  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center">
        <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="text-gray-500">Henüz ilanın yok.</p>
        <Link href="/ilan-ver" className="mt-3 inline-block text-sm font-semibold text-primary-600 hover:text-primary-500">İlk ilanını ver →</Link>
      </div>
    )
  }

  // Süresi dolmak üzere olan aktif ilanlar en üste — Array.sort kararlı olduğu
  // için geri kalan sıralama (API'den gelen created_at DESC) korunur.
  const sorted = [...listings].sort((a, b) => Number(isUrgent(b)) - Number(isUrgent(a)))

  return (
    <div className="space-y-3">
      {sorted.map(listing => (
        <ListingCard
          key={listing.id} listing={listing} urgent={isUrgent(listing)}
          busy={actingId === listing.id}
          onConfirm={() => handleConfirm(listing.id)}
          onStatus={status => handleStatus(listing.id, status)}
        />
      ))}
    </div>
  )
}

function ListingCard({
  listing, urgent, busy, onConfirm, onStatus,
}: {
  listing: SellerListing
  urgent: boolean
  busy: boolean
  onConfirm: () => void
  onStatus: (status: 'active' | 'reserved' | 'sold' | 'removed') => void
}) {
  return (
    <div className={`rounded-2xl border p-4 ${urgent ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex gap-4">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {listing.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listingImageUrl(listing.cover)} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300"><Tag className="h-6 w-6" /></div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_COLORS[listing.status]}`}>
              {STATUS_LABELS[listing.status]}
            </span>
            {urgent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                <AlertTriangle className="h-3 w-3" /> {daysLeftLabel(listing.expires_at)}
              </span>
            )}
          </div>
          <h3 className="mt-1.5 truncate font-bold text-gray-900">{listing.title}</h3>
          <p className="truncate text-sm text-gray-500">{listing.part_label}{listing.vehicle_label ? ` · ${listing.vehicle_label}` : ''}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-bold text-gray-900">{formatPrice(listing)}</span>
            {!urgent && listing.status === 'active' && (
              <span className="text-xs text-gray-400">{daysLeftLabel(listing.expires_at)}</span>
            )}
            <span className="text-xs text-gray-400">{listing.view_count} görüntülenme</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
        {(listing.status === 'active' || listing.status === 'expired') && (
          <button
            onClick={onConfirm} disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-400 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Hâlâ Var
          </button>
        )}
        {listing.status === 'active' && (
          <>
            <button onClick={() => onStatus('reserved')} disabled={busy} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              Ayrıldı olarak işaretle
            </button>
            <button onClick={() => onStatus('sold')} disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              <CheckCircle2 className="h-3.5 w-3.5" /> Satıldı
            </button>
          </>
        )}
        {listing.status === 'reserved' && (
          <>
            <button onClick={() => onStatus('active')} disabled={busy} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              Yayına al
            </button>
            <button onClick={() => onStatus('sold')} disabled={busy} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              Satıldı
            </button>
          </>
        )}
        {(listing.status === 'active' || listing.status === 'reserved' || listing.status === 'expired') && (
          <button onClick={() => onStatus('removed')} disabled={busy} className="ml-auto text-xs font-semibold text-gray-400 hover:text-red-600 disabled:opacity-50">
            Kaldır
          </button>
        )}
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
      </div>
    </div>
  )
}
