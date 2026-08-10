/**
 * Satıcı paneli API client — pazaryeri.parcabizden.com.tr
 *
 * Backend sözleşmesi: her istek POST/GET {API_BASE}/?action=..., X-Requested-With:
 * XMLHttpRequest, giriş gerektiren uçlarda Authorization: Bearer <token>.
 * Token 'token' anahtarıyla localStorage'da tutulur — bu, src/contexts/AuthContext'in
 * kullandığı anahtarla aynıdır, böylece giriş sonrası useAuth() aynı oturumu görür.
 *
 * Satıcı hesapları alıcı hesaplarından ayrıdır (users.account_type). Bu ayrım tarayıcı
 * tarafında da doğal olarak korunur: pazaryeri.parcabizden.com.tr ayrı bir origin
 * olduğu için localStorage alıcı sitesiyle paylaşılmaz.
 */

import type { ConditionType, ShippingPayer } from '@/lib/listings'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

/** Backend hatalarını status koduyla birlikte taşıyan hata tipi (409 vb. ayrımlar için). */
export class SellerApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'SellerApiError'
    this.status = status
  }
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest', ...extra }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function sellerGet<T>(params: Record<string, string>): Promise<T> {
  const res = await fetch(`${API_BASE}/?${new URLSearchParams(params).toString()}`, { headers: authHeaders() })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data || data.error) {
    throw new SellerApiError((data && data.error) || 'İstek başarısız oldu', res.status)
  }
  return data as T
}

async function sellerPost<T>(params: Record<string, string>): Promise<T> {
  const res = await fetch(`${API_BASE}/`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
    body: new URLSearchParams(params).toString(),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data || data.error) {
    throw new SellerApiError((data && data.error) || 'İstek başarısız oldu', res.status)
  }
  return data as T
}

// ==================== Satıcı girişi / kaydı ====================

export interface SellerAuthUser {
  id: number
  email: string
  name: string
  phone: string | null
}

export interface SellerAuthResult {
  token: string
  user: SellerAuthUser
  message?: string
}

/** Backend'in ürettiği genel hata metnini panelde anlaşılır bir mesaja çevirir. */
export function describeSellerAuthError(message: string): string {
  if (message === 'Bu hesap bu panele ait degil') {
    return 'Bu e-posta alıcı hesabı olarak kayıtlı. Satıcı hesabınız yoksa kayıt olun.'
  }
  return message
}

export async function sellerLogin(email: string, password: string): Promise<SellerAuthResult> {
  const result = await sellerPost<SellerAuthResult>({ action: 'login', email, password, account_type: 'seller' })
  if (typeof window !== 'undefined') localStorage.setItem('token', result.token)
  return result
}

export async function sellerRegister(
  email: string, password: string, name: string, phone?: string
): Promise<SellerAuthResult> {
  const params: Record<string, string> = { action: 'register', email, password, name, account_type: 'seller' }
  if (phone) params.phone = phone
  const result = await sellerPost<SellerAuthResult>(params)
  if (typeof window !== 'undefined') localStorage.setItem('token', result.token)
  return result
}

// ==================== İlanlarım ====================

export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'reserved' | 'sold' | 'expired' | 'removed'

export interface SellerListing {
  id: number
  title: string
  slug: string
  part_label: string
  condition_type: ConditionType
  quantity: number
  price: string | null
  price_min: string | null
  price_max: string | null
  status: ListingStatus
  vehicle_label: string | null
  published_at: string | null
  last_confirmed_at: string | null
  expires_at: string | null
  view_count: number
  cover: string | null
}

export function fetchMyListings(): Promise<{ listings: SellerListing[] }> {
  return sellerGet({ action: 'listing_mine' })
}

/** "Hâlâ var" teyidi — ilanın süresini uzatır. */
export function confirmListing(listingId: number): Promise<{ success: boolean; expires_at: string }> {
  return sellerPost({ action: 'listing_confirm', listing_id: String(listingId) })
}

export function setListingStatus(
  listingId: number, status: 'active' | 'reserved' | 'sold' | 'removed'
): Promise<{ success: boolean; status: string }> {
  return sellerPost({ action: 'listing_set_status', listing_id: String(listingId), status })
}

/** İlan görsel yolunu (ör. "uploads/listings/12/0-abc.jpg") mutlak URL'e çevirir. */
export function listingImageUrl(path: string): string {
  return `${API_BASE}/${path}`
}

// ==================== Gelen talepler ====================

export interface SellerRequestItem {
  id: number
  request_id: number
  part_label: string
  oem_number: string | null
  quantity: number
  note: string | null
}

export interface SellerRequest {
  id: number
  vehicle_label: string | null
  vin: string | null
  city_id: number | null
  city_name: string | null
  budget_max: string | null
  created_at: string
  expires_at: string
  dispatched_at: string
  item_count: number
  my_offer_count: number
  items: SellerRequestItem[]
}

export function fetchSellerRequests(): Promise<{ requests: SellerRequest[] }> {
  return sellerGet({ action: 'seller_requests' })
}

// ==================== Teklifler ====================

export type OfferStatus = 'sent' | 'seen' | 'accepted' | 'rejected' | 'withdrawn' | 'expired'

export interface CreateOfferInput {
  request_item_id: number
  price: string
  condition_type: ConditionType
  warranty_days?: number
  ships_in_days?: number
  shipping_payer?: ShippingPayer
  note?: string
  listing_id?: number
}

export function createOffer(input: CreateOfferInput): Promise<{ success: boolean; offer_id: number }> {
  const params: Record<string, string> = {
    action: 'offer_create',
    request_item_id: String(input.request_item_id),
    price: input.price,
    condition_type: input.condition_type,
  }
  if (input.warranty_days !== undefined) params.warranty_days = String(input.warranty_days)
  if (input.ships_in_days !== undefined) params.ships_in_days = String(input.ships_in_days)
  if (input.shipping_payer) params.shipping_payer = input.shipping_payer
  if (input.note) params.note = input.note
  if (input.listing_id !== undefined) params.listing_id = String(input.listing_id)
  return sellerPost(params)
}

export interface SellerOffer {
  id: number
  price: string
  condition_type: ConditionType
  warranty_days: number
  ships_in_days: number | null
  status: OfferStatus
  created_at: string
  seen_at: string | null
  decided_at: string | null
  part_label: string
  quantity: number
  request_id: number
  vehicle_label: string | null
}

export function fetchMyOffers(): Promise<{ offers: SellerOffer[] }> {
  return sellerGet({ action: 'offer_mine' })
}

export function withdrawOffer(offerId: number): Promise<{ success: boolean }> {
  return sellerPost({ action: 'offer_withdraw', offer_id: String(offerId) })
}
