import type {
  Brand,
  Model,
  Segment,
  ApiResponse,
  AuthResponse,
  GarageVehicle,
  GarageVehicleNatro,
  MaintenanceRecord,
  User,
  UserProfile,
  UserAddress,
  Order,
  FavoriteProduct,
  VehicleSpecRow,
  VehicleSpecModel,
  AutodataBrand,
  AutodataModel,
  AutodataGeneration,
  SlugMatch,
} from '@/types/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  })

  let data: T
  try {
    data = await res.json()
  } catch {
    throw new Error('Sunucu yanıtı işlenemedi')
  }

  if (!res.ok) {
    const errorData = data as Record<string, unknown>
    throw new Error((errorData?.error as string) || 'API hatası oluştu')
  }

  return data
}

// ==================== Brands ====================

// ==================== Models ====================

// ==================== Segments ====================

// ==================== Years ====================

// ==================== Auth (action-based) ====================

export async function register(email: string, password: string, name: string, phone?: string): Promise<AuthResponse> {
  const params: Record<string, string> = { action: 'register', email, password, name }
  if (phone) params.phone = phone
  return actionPost<AuthResponse>(params)
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return actionPost<AuthResponse>({ action: 'login', email, password })
}

export async function getProfile(): Promise<User> {
  const res = await actionPost<{ user: User }>({ action: 'profile' })
  return res.user
}

// ==================== Email Verification ====================

export async function verifyEmail(token: string): Promise<{ success?: boolean; message: string }> {
  return actionPost<{ success?: boolean; message: string }>({ action: 'verify_email', token })
}

export async function resendVerify(email: string): Promise<{ success?: boolean; message: string }> {
  return actionPost<{ success?: boolean; message: string }>({ action: 'resend_verify', email })
}

// ==================== Password Reset ====================

export async function forgotPassword(email: string): Promise<{ success?: boolean; message: string }> {
  return actionPost<{ success?: boolean; message: string }>({ action: 'forgot_password', email })
}

export async function resetPassword(token: string, password: string): Promise<{ success?: boolean; message: string }> {
  return actionPost<{ success?: boolean; message: string }>({ action: 'reset_password', token, password })
}

// ==================== Garage (Natro backend) ====================

export async function garageList(): Promise<{ vehicles: GarageVehicleNatro[] }> {
  return actionPost<{ vehicles: GarageVehicleNatro[] }>({ action: 'garage_list' })
}

export async function garageAdd(data: {
  // Yeni: TecDoc ID payload (Faz 3.2)
  manufacturer_id?: number
  model_id?: number
  vehicle_id_ktype?: number
  model_name?: string
  // Eski: slug payload (geriye uyum)
  brand_slug?: string
  brand_name?: string
  generation_slug?: string
  generation_name?: string
  // Ortak alanlar
  year?: number
  nickname?: string
  spec_id?: number
  plaka?: string
  sase_no?: string
}): Promise<{ success: boolean; id?: number }> {
  const params: Record<string, string> = { action: 'garage_add' }
  if (data.manufacturer_id)  params.manufacturer_id   = String(data.manufacturer_id)
  if (data.model_id)         params.model_id          = String(data.model_id)
  if (data.vehicle_id_ktype) params.vehicle_id_ktype  = String(data.vehicle_id_ktype)
  if (data.model_name)       params.model_name        = data.model_name
  if (data.brand_slug)       params.brand_slug        = data.brand_slug
  if (data.brand_name)       params.brand_name        = data.brand_name
  if (data.generation_slug)  params.generation_slug   = data.generation_slug
  if (data.generation_name)  params.generation_name   = data.generation_name
  if (data.year)             params.year              = String(data.year)
  if (data.nickname)         params.nickname          = data.nickname
  if (data.spec_id)          params.spec_id           = String(data.spec_id)
  if (data.plaka)            params.plaka             = data.plaka
  if (data.sase_no)          params.sase_no           = data.sase_no
  return actionPost<{ success: boolean; id?: number }>(params)
}

export async function garageRemove(id: number): Promise<{ success: boolean }> {
  return actionPost<{ success: boolean }>({ action: 'garage_remove', id: String(id) })
}

export async function garageUpdate(data: {
  id: number
  nickname?: string
  current_km?: number
  notes?: string
  plaka?: string
  sase_no?: string
}): Promise<{ success: boolean }> {
  const params: Record<string, string> = { action: 'garage_update', id: String(data.id) }
  if (data.nickname !== undefined) params.nickname = data.nickname
  if (data.current_km !== undefined) params.current_km = String(data.current_km)
  if (data.notes !== undefined) params.notes = data.notes
  if (data.plaka !== undefined) params.plaka = data.plaka
  if (data.sase_no !== undefined) params.sase_no = data.sase_no
  return actionPost<{ success: boolean }>(params)
}

export async function maintenanceList(garageId: number): Promise<{ records: MaintenanceRecord[] }> {
  return actionPost<{ records: MaintenanceRecord[] }>({ action: 'maintenance_list', garage_id: String(garageId) })
}

export async function maintenanceAdd(data: {
  garage_id: number
  maintenance_type: string
  done_km?: number
  done_date?: string
  next_km?: number
  next_date?: string
  notes?: string
}): Promise<{ success: boolean; id: number }> {
  const params: Record<string, string> = {
    action: 'maintenance_add',
    garage_id: String(data.garage_id),
    maintenance_type: data.maintenance_type,
  }
  if (data.done_km !== undefined) params.done_km = String(data.done_km)
  if (data.done_date) params.done_date = data.done_date
  if (data.next_km !== undefined) params.next_km = String(data.next_km)
  if (data.next_date) params.next_date = data.next_date
  if (data.notes) params.notes = data.notes
  return actionPost<{ success: boolean; id: number }>(params)
}

export async function maintenanceUpdate(data: {
  id: number
  maintenance_type?: string
  done_km?: number | null
  done_date?: string | null
  next_km?: number | null
  next_date?: string | null
  notes?: string | null
}): Promise<{ success: boolean }> {
  const params: Record<string, string> = { action: 'maintenance_update', id: String(data.id) }
  if (data.maintenance_type !== undefined) params.maintenance_type = data.maintenance_type
  if (data.done_km !== undefined) params.done_km = data.done_km !== null ? String(data.done_km) : ''
  if (data.done_date !== undefined) params.done_date = data.done_date ?? ''
  if (data.next_km !== undefined) params.next_km = data.next_km !== null ? String(data.next_km) : ''
  if (data.next_date !== undefined) params.next_date = data.next_date ?? ''
  if (data.notes !== undefined) params.notes = data.notes ?? ''
  return actionPost<{ success: boolean }>(params)
}

export async function maintenanceRemove(id: number): Promise<{ success: boolean }> {
  return actionPost<{ success: boolean }>({ action: 'maintenance_remove', id: String(id) })
}

// ==================== Vehicle Parts API (action-based) ====================

export interface VehicleCategory {
  id: string
  name_tr: string
  name_en: string
  icon: string
  sort_order: number
  total_parts: number
  node_count: number
}

export interface VehicleNode {
  name: string
  label: string
  part_count: number
}

export interface ProductEnrichment {
  id: number
  slug: string
  price: number | null
  discount_price: number | null
  thumbnail: string | null
  in_stock: boolean
}

export interface VehiclePart {
  oem_number: string
  name: string
  brand_slug?: string
  generation_slug?: string
  node_name_en?: string
  product?: ProductEnrichment
}

export interface OemSearchResult {
  oem_number: string
  name: string
  brand_slug: string
  generation_slug: string
  node_name_en: string
  product?: ProductEnrichment
}

async function actionFetch<T>(params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams(params).toString()
  const res = await fetch(`${API_BASE}/?${query}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

async function actionPost<T>(params: Record<string, string>): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}/`, {
    method: 'POST',
    headers,
    body: new URLSearchParams(params).toString(),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error((data && data.error) || `API error: ${res.status}`)
  }
  if (data && data.error) throw new Error(data.error)
  return data
}

/** Oturum gerektiren GET. actionFetch token göndermiyor, o herkese açık uçlar için. */
async function actionGetAuth<T>(params: Record<string, string>): Promise<T> {
  const headers: Record<string, string> = {}
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}/?${new URLSearchParams(params).toString()}`, { headers })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error((data && data.error) || `API error: ${res.status}`)
  if (data && data.error) throw new Error(data.error)
  return data
}

/**
 * Dosya içeren POST. Content-Type ELLE SET EDİLMEZ — tarayıcı multipart
 * boundary'sini kendisi üretir; elle yazılırsa istek bozulur.
 */
async function actionPostForm<T>(action: string, form: FormData): Promise<T> {
  form.set('action', action)
  const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}/`, { method: 'POST', headers, body: form })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error((data && data.error) || `API error: ${res.status}`)
  if (data && data.error) throw new Error(data.error)
  return data
}

// ==================== Pazaryeri: coğrafya ve satıcı ====================

export interface GeoCity { id: number; name: string; slug: string }
export interface GeoDistrict { id: number; name: string; slug: string }

export type SellerStatus = 'pending' | 'approved' | 'suspended' | 'rejected'

export interface SellerProfile {
  id: number
  name: string
  slug: string
  city_id: number
  district_id: number | null
  city_name: string
  district_name: string | null
  address: string | null
  whatsapp: string
  phone: string | null
  status: SellerStatus
  rejection_reason: string | null
  approved_at: string | null
  created_at: string
  has_document: boolean
  median_response_minutes: number | null
  offer_rate: string | null
  listing_freshness_rate: string | null
}

export function fetchCities(): Promise<{ cities: GeoCity[] }> {
  return actionFetch<{ cities: GeoCity[] }>({ action: 'geo_cities' })
}

export function fetchDistricts(cityId: number): Promise<{ districts: GeoDistrict[] }> {
  return actionFetch<{ districts: GeoDistrict[] }>({ action: 'geo_districts', city_id: String(cityId) })
}

/** Mağazası yoksa seller null döner — hata değil. */
export function fetchMySeller(): Promise<{ seller: SellerProfile | null }> {
  return actionGetAuth<{ seller: SellerProfile | null }>({ action: 'seller_me' })
}

export function registerSeller(form: FormData) {
  return actionPostForm<{ success: boolean; message: string; seller: { id: number; slug: string; status: SellerStatus } }>(
    'seller_register', form
  )
}

// ── In-memory cache for categories, nodes, brands (5 min TTL) ──
const CACHE_TTL = 5 * 60 * 1000
const MAX_CACHE_SIZE = 100

type CacheEntry<T> = { data: T; timestamp: number }

// LRU benzeri cache — boyut aşılırsa en eski entry silinir
function cacheSet<K, V>(map: Map<K, CacheEntry<V>>, key: K, value: V): void {
  if (map.size >= MAX_CACHE_SIZE) {
    const oldest = map.keys().next().value
    if (oldest !== undefined) map.delete(oldest)
  }
  map.set(key, { data: value, timestamp: Date.now() })
}

const categoriesCache = new Map<string, CacheEntry<{ categories: VehicleCategory[]; total_parts: number }>>()
const nodesCache = new Map<string, CacheEntry<{ nodes: VehicleNode[] }>>()

// ── In-memory generations cache (10 min TTL) ──
type GenerationsData = { generations: Array<{ generation_slug: string; generation_name: string; part_count: number }> }
const generationsCache = new Map<string, { data: GenerationsData; timestamp: number }>()
const GEN_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// ==================== Vehicle Specs (Autodata) ====================

// ==================== Autodata Endpoints ====================

// ==================== Vehicle Specs (Autodata) ====================

// ==================== Diagram Lookup ====================

const diagramCache = new Map<string, Record<string, Record<string, string>>>()

export async function fetchDiagramUrl(brand: string, gen: string, node: string): Promise<string | null> {
  if (!brand || !gen || !node) return null
  if (!diagramCache.has(brand)) {
    try {
      const res = await fetch(`/data/diagrams/${brand}.json`)
      if (res.ok) diagramCache.set(brand, await res.json())
      else return null
    } catch { return null }
  }
  return diagramCache.get(brand)?.[gen]?.[node] || null
}

// ==================== Vehicle Specs (Autodata) ====================

export function fetchVehicleSpecs(brand: string, generation?: string, year?: number, model?: string, specId?: number) {
  const params: Record<string, string> = { action: 'vehicle_specs', brand }
  if (specId) params.spec_id = String(specId)
  if (generation) params.generation = generation
  if (year) params.year = String(year)
  if (model) params.model = model
  return actionFetch<{ specs: VehicleSpecRow[]; models: VehicleSpecModel[]; brand: string }>(params)
}

// ==================== Profile ====================

export async function profileUpdate(data: {
  name?: string
  phone?: string
  gsm?: string
  address_line1?: string
  address_line2?: string
  city?: string
  district?: string
  postal_code?: string
}): Promise<{ success: boolean; user: UserProfile }> {
  const params: Record<string, string> = { action: 'profile_update' }
  if (data.name !== undefined) params.name = data.name
  if (data.phone !== undefined) params.phone = data.phone
  if (data.gsm !== undefined) params.gsm = data.gsm
  if (data.address_line1 !== undefined) params.address_line1 = data.address_line1
  if (data.address_line2 !== undefined) params.address_line2 = data.address_line2
  if (data.city !== undefined) params.city = data.city
  if (data.district !== undefined) params.district = data.district
  if (data.postal_code !== undefined) params.postal_code = data.postal_code
  return actionPost<{ success: boolean; user: UserProfile }>(params)
}

export async function getProfileFull(): Promise<UserProfile> {
  const res = await actionPost<{ user: UserProfile }>({ action: 'profile' })
  return res.user
}

// ==================== Addresses ====================

// ==================== Orders ====================

// ==================== Password Change ====================

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return actionPost<{ success: boolean; message: string }>({
    action: 'change_password',
    current_password: currentPassword,
    new_password: newPassword,
  })
}

export async function deleteAccount(password: string): Promise<{ success: boolean }> {
  return actionPost<{ success: boolean }>({ action: 'delete_account', password })
}

// ==================== Reviews ====================

// reviews.php her zaman Natro'da — dev'de de production URL kullan
const REVIEWS_API = process.env.NEXT_PUBLIC_REVIEWS_URL || 'https://api.parcabizden.com.tr/reviews.php'

export interface Review {
  id: number
  author_name: string
  rating: number
  title: string | null
  comment: string
  verified: number
  helpful_count: number
  created_at: string
}

export interface ReviewSummary {
  total: number
  average: number
  distribution: Record<number, number>
}

// ==================== Admin: Satıcı Onay Kuyruğu ====================

export type AdminSellerStatus = SellerStatus | 'all'

export interface AdminSellerListItem {
  id: number
  name: string
  slug: string
  status: SellerStatus
  tax_number: string | null
  whatsapp: string
  phone: string | null
  address: string | null
  created_at: string
  approved_at: string | null
  rejection_reason: string | null
  city_name: string
  district_name: string | null
  owner_email: string
  owner_name: string
  has_document: boolean
}

/** Admin auth gerektiren GET; actionGetAuth'tan farklı olarak X-Requested-With de taşır. */
async function actionGetAdmin<T>(params: Record<string, string>): Promise<T> {
  const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}/?${new URLSearchParams(params).toString()}`, { headers })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error((data && data.error) || `API error: ${res.status}`)
  if (data && data.error) throw new Error(data.error)
  return data
}

export function adminSellerList(status: AdminSellerStatus = 'pending'): Promise<{ sellers: AdminSellerListItem[] }> {
  return actionGetAdmin<{ sellers: AdminSellerListItem[] }>({ action: 'admin_seller_list', status })
}

export function adminSellerDecide(
  sellerId: number,
  decision: 'approved' | 'rejected' | 'suspended',
  reason?: string
): Promise<{ success: boolean; message: string; status: string }> {
  const params: Record<string, string> = { action: 'admin_seller_decide', seller_id: String(sellerId), decision }
  if (reason) params.reason = reason
  return actionPost<{ success: boolean; message: string; status: string }>(params)
}

/**
 * Vergi levhası binary (PDF/JPG/PNG) döner, JSON değil.
 * Authorization header gerektirdiği için <img>/<a> ile doğrudan açılamaz;
 * blob olarak indirilip URL.createObjectURL ile gösterilmeli.
 */
export async function adminSellerDocument(sellerId: number): Promise<Blob> {
  const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}/?${new URLSearchParams({ action: 'admin_seller_document', seller_id: String(sellerId) }).toString()}`, { headers })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error((data && data.error) || `API error: ${res.status}`)
  }
  return res.blob()
}
