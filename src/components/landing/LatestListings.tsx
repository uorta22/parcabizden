'use client'

/**
 * LatestListings — anasayfada pazaryerinin en yeni ilanlarını gösterir.
 *
 * Pazaryerinde ilan yoksa (ya da API'ye erişilemezse) boş bir grid yerine
 * talebe yönlendiren bir CTA bloğu gösterilir — anasayfa hiçbir zaman
 * "kırık" görünmemeli.
 *
 * Kart görünümü `src/app/(site)/ilanlar/page.tsx` içindeki ListingGridCard
 * ile aynı dili kullanır (aynı dosya değil — o dosyaya dokunmak yasak).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ImageOff, MapPin, MessageSquarePlus, ShieldCheck, Store } from 'lucide-react'
import { Skeleton } from '@/components/Skeleton'
import EmptyState from '@/components/EmptyState'
import {
  searchListings,
  type ListingCard as ListingCardData,
  type ListingConditionType,
} from '@/lib/listing-search'
import { siteConfig } from '@/lib/config'

const ACCENT = '#ff7a1a'
const TALEP_URL = siteConfig.surfaces.request
const PER_PAGE = 8

const CONDITION_LABELS: Record<ListingConditionType, string> = {
  cikma: 'Çıkma',
  sifir: 'Sıfır',
  yenilenmis: 'Yenilenmiş',
}

const CONDITION_COLORS: Record<ListingConditionType, string> = {
  cikma: 'bg-amber-100 text-amber-800',
  sifir: 'bg-emerald-100 text-emerald-800',
  yenilenmis: 'bg-blue-100 text-blue-800',
}

function formatListingPrice(listing: ListingCardData): string {
  if (listing.price !== null) return `${listing.price.toLocaleString('tr-TR')} ₺`
  if (listing.price_min !== null && listing.price_max !== null) {
    return `${listing.price_min.toLocaleString('tr-TR')} – ${listing.price_max.toLocaleString('tr-TR')} ₺`
  }
  return 'Fiyat belirtilmemiş'
}

export default function LatestListings() {
  const [listings, setListings] = useState<ListingCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    searchListings({ sort: 'newest', per_page: PER_PAGE })
      .then(res => { if (!cancelled) setListings(res.listings) })
      .catch(() => { if (!cancelled) setFailed(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // İlan yoksa ya da API'ye erişilemediyse: boş grid yerine talebe yönlendiren blok.
  const showRequestPrompt = !loading && (failed || listings.length === 0)

  return (
    <section className="border-t border-gray-200 bg-white py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        {!showRequestPrompt && (
          <header className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 md:text-2xl">Yeni Eklenen İlanlar</h2>
              <p className="text-sm text-gray-500">Satıcıların pazaryerine az önce eklediği ilanlar</p>
            </div>
            <Link
              href="/ilanlar"
              className="text-sm font-semibold underline-offset-4 hover:underline"
              style={{ color: ACCENT }}
            >
              Tüm ilanlar →
            </Link>
          </header>
        )}

        {loading && <LatestListingsSkeleton />}

        {showRequestPrompt && (
          <EmptyState
            icon={<MessageSquarePlus className="h-8 w-8" />}
            title="Aradığın parçayı satıcılara sor"
            description="Pazaryerinde şu an ilan az — üyelik gerekmeden talep açabilirsin, doğrulanmış satıcılar sana teklif gönderir."
            action={{ label: 'Talep Aç', href: TALEP_URL, icon: <ArrowRight className="h-4 w-4" /> }}
          />
        )}

        {!loading && !showRequestPrompt && (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {listings.map(listing => (
              <li key={listing.id}>
                <LatestListingCard listing={listing} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function LatestListingCard({ listing }: { listing: ListingCardData }) {
  const [imgFailed, setImgFailed] = useState(false)
  const hasCover = !!listing.cover && !imgFailed
  const fitmentVerified = listing.fitment_source === 'catalog_verified' || listing.fitment_source === 'vin_verified'

  return (
    <Link
      href={`/ilan/${listing.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-lg"
    >
      <div className="relative aspect-square border-b border-gray-100 bg-gray-50">
        {hasCover ? (
          <Image
            src={listing.cover!}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-gray-300">
            <ImageOff className="h-9 w-9" />
            <span className="text-[10px] font-medium">Görsel yok</span>
          </div>
        )}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${CONDITION_COLORS[listing.condition_type]}`}>
          {CONDITION_LABELS[listing.condition_type]}
        </span>
        {fitmentVerified && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
            <ShieldCheck className="h-3 w-3" /> Uyum doğrulandı
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-gray-900 group-hover:text-primary-600">
          {listing.title}
        </h3>
        {listing.vehicle_label && (
          <p className="truncate text-xs text-gray-500">{listing.vehicle_label}</p>
        )}
        <p className="mt-auto text-base font-black text-gray-900">{formatListingPrice(listing)}</p>
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2 text-[11px] text-gray-500">
          <span className="flex min-w-0 items-center gap-1 truncate">
            <Store className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{listing.seller_name}</span>
          </span>
          {listing.city_name && (
            <span className="flex flex-shrink-0 items-center gap-1">
              <MapPin className="h-3 w-3" /> {listing.city_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function LatestListingsSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-hidden="true">
      {Array.from({ length: PER_PAGE }).map((_, i) => (
        <li key={i} className="overflow-hidden rounded-2xl border border-gray-100">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  )
}
