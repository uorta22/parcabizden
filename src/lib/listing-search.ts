/**
 * İlan arama API client — alıcı tarafı arama/listeleme sayfası için.
 *
 * Backend: php-backend/listings.php → handle_listing_search (action=listing_search)
 * Şema: migration-marketplace-01-core.sql (listings, sellers, cities, districts)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.parcabizden.com.tr'

export type ListingConditionType = 'cikma' | 'sifir' | 'yenilenmis'
export type ListingSortOption = 'newest' | 'price_asc' | 'price_desc'

/**
 * Uyumun nereden geldiğini gösterir. `catalog_verified`/`vin_verified` katalog
 * üzerinden doğrulanmıştır; `seller_declared` satıcı beyanıdır (detay sayfasında açıklanır).
 */
export type ListingFitmentSource = 'catalog_verified' | 'vin_verified' | 'seller_declared'

export interface ListingSearchParams {
  q?: string
  manufacturer_id?: number
  model_id?: number
  vehicle_id?: number
  category?: string
  city_id?: number
  condition_type?: ListingConditionType
  price_min?: number
  price_max?: number
  sort?: ListingSortOption
  page?: number
  per_page?: number
}

export interface ListingCard {
  id: number
  title: string
  slug: string
  part_label: string | null
  condition_type: ListingConditionType
  price: number | null
  price_min: number | null
  price_max: number | null
  vehicle_label: string | null
  oem_number: string | null
  fitment_source: ListingFitmentSource
  published_at: string | null
  seller_name: string
  seller_slug: string
  city_name: string | null
  district_name: string | null
  /** Mutlak URL — yoksa null (yer tutucu gösterilir). */
  cover: string | null
}

export interface ListingSearchResponse {
  listings: ListingCard[]
  total: number
  page: number
  per_page: number
}

function toInt(v: unknown): number {
  return typeof v === 'number' ? v : parseInt(String(v ?? '0'), 10) || 0
}
function toFloatOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = parseFloat(String(v))
  return Number.isNaN(n) ? null : n
}

/** Backend göreceli (uploads/...) yol döndürürse, mutlaka API_BASE'i ön eke ekle. */
function absoluteImageUrl(p: string): string {
  if (/^https?:\/\//i.test(p)) return p
  return `${API_BASE}${p.startsWith('/') ? '' : '/'}${p}`
}

/** İlanları filtrelere göre arar. Tüm parametreler opsiyonel. */
export async function searchListings(params: ListingSearchParams = {}): Promise<ListingSearchResponse> {
  const search = new URLSearchParams({ action: 'listing_search' })
  if (params.q) search.set('q', params.q)
  if (params.manufacturer_id) search.set('manufacturer_id', String(params.manufacturer_id))
  if (params.model_id) search.set('model_id', String(params.model_id))
  if (params.vehicle_id) search.set('vehicle_id', String(params.vehicle_id))
  if (params.category) search.set('category', params.category)
  if (params.city_id) search.set('city_id', String(params.city_id))
  if (params.condition_type) search.set('condition_type', params.condition_type)
  if (params.price_min !== undefined) search.set('price_min', String(params.price_min))
  if (params.price_max !== undefined) search.set('price_max', String(params.price_max))
  if (params.sort) search.set('sort', params.sort)
  if (params.page) search.set('page', String(params.page))
  if (params.per_page) search.set('per_page', String(params.per_page))

  const res = await fetch(`${API_BASE}/?${search.toString()}`)
  if (!res.ok) throw new Error(`API hatası: ${res.status}`)
  const data = await res.json()
  if (data?.error) throw new Error(data.error)

  return {
    total: toInt(data.total),
    page: toInt(data.page),
    per_page: toInt(data.per_page),
    listings: (data.listings || []).map((l: Record<string, unknown>) => ({
      id: toInt(l.id),
      title: String(l.title ?? ''),
      slug: String(l.slug ?? ''),
      part_label: (l.part_label as string) ?? null,
      condition_type: l.condition_type as ListingConditionType,
      price: toFloatOrNull(l.price),
      price_min: toFloatOrNull(l.price_min),
      price_max: toFloatOrNull(l.price_max),
      vehicle_label: (l.vehicle_label as string) ?? null,
      oem_number: (l.oem_number as string) ?? null,
      fitment_source: l.fitment_source as ListingFitmentSource,
      published_at: (l.published_at as string) ?? null,
      seller_name: String(l.seller_name ?? ''),
      seller_slug: String(l.seller_slug ?? ''),
      city_name: (l.city_name as string) ?? null,
      district_name: (l.district_name as string) ?? null,
      cover: l.cover ? absoluteImageUrl(String(l.cover)) : null,
    })),
  }
}
