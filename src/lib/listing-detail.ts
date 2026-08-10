/**
 * İlan detay API client — alıcı sitesindeki tekil ilan sayfası (/ilan/[slug]).
 *
 * Backend sözleşmesi: GET {API_BASE}/?action=listing_detail&slug={slug}
 * → { listing: {...} }. Bulunamazsa 404 + { error }.
 * Alan listesi php-backend/listings.php → handle_listing_detail'deki SELECT'ten.
 *
 * Hem sunucu (generateMetadata) hem tarayıcı tarafından çağrılır; bu yüzden
 * localStorage/window gibi tarayıcıya özel hiçbir şey içermez.
 */

import type { ConditionType, ShippingPayer } from '@/lib/listings'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export type FitmentSource = 'seller_declared' | 'catalog_verified' | 'vin_verified'
export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'reserved' | 'sold' | 'expired' | 'removed'

export interface ListingDetail {
  id: number
  seller_id: number
  title: string
  slug: string
  description: string | null

  vehicle_id: number | null
  model_id: number | null
  manufacturer_id: number | null
  vehicle_label: string | null
  year_from: number | null
  year_to: number | null

  category_id: number | null
  part_label: string
  oem_number: string | null
  fitment_source: FitmentSource

  condition_type: ConditionType
  quantity: number

  price: string | null
  price_min: string | null
  price_max: string | null
  shipping_payer: ShippingPayer

  status: ListingStatus
  published_at: string | null
  last_confirmed_at: string | null
  expires_at: string | null
  sold_at: string | null

  view_count: number
  images: string[]

  seller_name: string
  seller_slug: string
  seller_whatsapp: string | null
  seller_phone: string | null
  seller_status: string
  median_response_minutes: number | null
  city_name: string | null
  district_name: string | null
}

/** Göreli görsel yolunu (uploads/listings/12/abc.jpg) tam URL'e çevirir. */
export function listingDetailImageUrl(path: string): string {
  return `${API_BASE}/${path}`
}

/** İlanı slug ile getirir. Bulunamazsa (404) null döner. */
export async function getListingDetail(slug: string): Promise<ListingDetail | null> {
  const res = await fetch(`${API_BASE}/?action=listing_detail&slug=${encodeURIComponent(slug)}`, {
    next: { revalidate: 120 },
  })
  if (res.status === 404) return null

  const data = await res.json().catch(() => null)
  if (!res.ok || !data || data.error || !data.listing) return null
  return data.listing as ListingDetail
}
