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
  Vehicle,
  CategoryGroup,
  SubCategory,
  CatalogPart,
  VehicleDetail,
  CrossRef,
} from '@/types/api'
import type { ShopProduct } from '@/types/shop'

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

export async function getBrands(popular?: boolean): Promise<Brand[]> {
  const params = popular ? '?popular=1' : ''
  const res = await fetchApi<ApiResponse<Brand[]>>(`/brands${params}`)
  return res.data
}

// ==================== Models ====================

export async function getModels(manufacturerId: number): Promise<Model[]> {
  const res = await fetchApi<ApiResponse<Model[]>>(`/models?manufacturer_id=${manufacturerId}`)
  return res.data
}

// ==================== Segments / Vehicles ====================

export async function getSegments(modelId: number): Promise<Segment[]> {
  const res = await fetchApi<ApiResponse<Segment[]>>(`/segments?model_id=${modelId}`)
  return res.data
}

// Yeni: vehicles tablosundan araçlar (KType bazlı)
export async function getVehicles(modelId: number): Promise<Vehicle[]> {
  const res = await fetchApi<ApiResponse<Vehicle[]>>(`/segments?model_id=${modelId}`)
  return res.data
}

// ==================== Years ====================

export async function getYears(vehicleId: number): Promise<number[]> {
  const res = await fetchApi<ApiResponse<number[]>>(`/years?vehicle_id=${vehicleId}`)
  return res.data
}

// ==================== Catalog Categories (v3 DB) ====================

export async function getCategoryGroups(vehicleId?: number): Promise<CategoryGroup[]> {
  const params = vehicleId ? `?vehicle_id=${vehicleId}` : ''
  const res = await fetchApi<ApiResponse<CategoryGroup[]>>(`/categories${params}`)
  return res.data
}

export async function getSubCategories(group: string, vehicleId?: number): Promise<SubCategory[]> {
  let params = `?group=${encodeURIComponent(group)}`
  if (vehicleId) params += `&vehicle_id=${vehicleId}`
  const res = await fetchApi<ApiResponse<SubCategory[]>>(`/categories${params}`)
  return res.data
}

// ==================== Catalog Parts (v3 DB) ====================

export async function getCatalogParts(params: {
  vehicle_id?: number
  category_id?: number
  group?: string
  supplier_id?: number
  page?: number
  limit?: number
}): Promise<{ data: CatalogPart[]; pagination: { page: number; limit: number; total: number; total_pages: number } }> {
  const searchParams = new URLSearchParams()
  if (params.vehicle_id) searchParams.set('vehicle_id', String(params.vehicle_id))
  if (params.category_id) searchParams.set('category_id', String(params.category_id))
  if (params.group) searchParams.set('group', params.group)
  if (params.supplier_id) searchParams.set('supplier_id', String(params.supplier_id))
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  return fetchApi<{ data: CatalogPart[]; pagination: { page: number; limit: number; total: number; total_pages: number } }>(`/parts?${searchParams}`)
}

// ==================== Vehicle Detail ====================

export async function getVehicleDetail(vehicleId: number): Promise<VehicleDetail> {
  const res = await fetchApi<ApiResponse<VehicleDetail>>(`/vehicle-detail?vehicle_id=${vehicleId}`)
  return res.data
}

// ==================== Cross Reference ====================

export async function getCrossRef(partNumber: string, supplierId?: number): Promise<CrossRef[]> {
  let params = `?part_number=${encodeURIComponent(partNumber)}`
  if (supplierId) params += `&supplier_id=${supplierId}`
  const res = await fetchApi<ApiResponse<CrossRef[]>>(`/cross-ref${params}`)
  return res.data
}

// ==================== Catalog Search ====================

export async function searchCatalog(query: string, page?: number): Promise<{ data: CatalogPart[]; query: string; pagination: { page: number; limit: number; total: number; total_pages: number } }> {
  let params = `?q=${encodeURIComponent(query)}`
  if (page) params += `&page=${page}`
  return fetchApi<{ data: CatalogPart[]; query: string; pagination: { page: number; limit: number; total: number; total_pages: number } }>(`/search${params}`)
}

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
  brand_slug: string
  brand_name: string
  generation_slug: string
  generation_name: string
  year?: number
  nickname?: string
  spec_id?: number
  plaka?: string
  sase_no?: string
}): Promise<{ success: boolean; id?: number }> {
  const params: Record<string, string> = {
    action: 'garage_add',
    brand_slug: data.brand_slug,
    brand_name: data.brand_name,
    generation_slug: data.generation_slug,
    generation_name: data.generation_name,
  }
  if (data.year) params.year = String(data.year)
  if (data.nickname) params.nickname = data.nickname
  if (data.spec_id) params.spec_id = String(data.spec_id)
  if (data.plaka) params.plaka = data.plaka
  if (data.sase_no) params.sase_no = data.sase_no
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

// ── In-memory cache for categories, nodes, brands (5 min TTL) ──
const CACHE_TTL = 5 * 60 * 1000
type CacheEntry<T> = { data: T; timestamp: number }
const categoriesCache = new Map<string, CacheEntry<{ categories: VehicleCategory[]; total_parts: number }>>()
const nodesCache = new Map<string, CacheEntry<{ nodes: VehicleNode[] }>>()
const brandsCache: { data: { brands: AutodataBrand[] } | null; timestamp: number } = { data: null, timestamp: 0 }

export async function fetchVehicleCategories(brand: string, gen: string) {
  const key = `${brand}_${gen}`
  const cached = categoriesCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data

  const data = await actionFetch<{ categories: VehicleCategory[]; total_parts: number }>({
    action: 'categories', brand, gen,
  })
  categoriesCache.set(key, { data, timestamp: Date.now() })
  return data
}

export async function fetchVehicleNodes(brand: string, gen: string, cat: string) {
  const key = `${brand}_${gen}_${cat}`
  const cached = nodesCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data

  const data = await actionFetch<{ nodes: VehicleNode[] }>({ action: 'nodes', brand, gen, cat })
  nodesCache.set(key, { data, timestamp: Date.now() })
  return data
}

export function fetchVehicleParts(brand: string, gen: string, node: string) {
  return actionFetch<{ parts: VehiclePart[] }>({ action: 'parts', brand, gen, node })
}

// ── In-memory generations cache (10 min TTL) ──
type GenerationsData = { generations: Array<{ generation_slug: string; generation_name: string; part_count: number }> }
const generationsCache = new Map<string, { data: GenerationsData; timestamp: number }>()
const GEN_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

export async function fetchGenerations(brand: string): Promise<GenerationsData> {
  const cached = generationsCache.get(brand)
  if (cached && Date.now() - cached.timestamp < GEN_CACHE_TTL) {
    return cached.data
  }

  // Use our ISR-cached proxy route instead of hitting external API directly
  const res = await fetch(`/api/generations?brand=${encodeURIComponent(brand)}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data: GenerationsData = await res.json()
  if ((data as unknown as { error?: string }).error) {
    throw new Error((data as unknown as { error: string }).error)
  }

  generationsCache.set(brand, { data, timestamp: Date.now() })
  return data
}

export function searchOemParts(query: string) {
  return actionFetch<{ results: OemSearchResult[]; query: string }>({
    action: 'search_oem', q: query,
  })
}

// ==================== Vehicle Specs (Autodata) ====================

// ==================== Autodata Endpoints ====================

export async function fetchAutodataBrands() {
  if (brandsCache.data && Date.now() - brandsCache.timestamp < CACHE_TTL) return brandsCache.data
  const data = await actionFetch<{ brands: AutodataBrand[] }>({ action: 'autodata_brands' })
  brandsCache.data = data
  brandsCache.timestamp = Date.now()
  return data
}

const modelsCache = new Map<string, CacheEntry<{ models: AutodataModel[]; brand: string }>>()

export async function fetchAutodataModels(brandSlug: string) {
  const cached = modelsCache.get(brandSlug)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data
  const data = await actionFetch<{ models: AutodataModel[]; brand: string }>({ action: 'autodata_models', brand: brandSlug })
  modelsCache.set(brandSlug, { data, timestamp: Date.now() })
  return data
}

export function fetchAutodataGenerations(brandSlug: string, model: string) {
  return actionFetch<{ generations: AutodataGeneration[] }>({ action: 'autodata_generations', brand: brandSlug, model })
}

export function resolveAutodataSlug(brandSlug: string, model: string, generation: string, year?: number) {
  const params: Record<string, string> = { action: 'autodata_resolve_slug', brand: brandSlug, model, generation }
  if (year) params.year = String(year)
  return actionFetch<{ matches: SlugMatch[]; auto_selected: string | null }>(params)
}

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

export async function addressList(): Promise<{ addresses: UserAddress[] }> {
  return actionPost<{ addresses: UserAddress[] }>({ action: 'address_list' })
}

export async function addressAdd(data: Omit<UserAddress, 'id'>): Promise<{ address: UserAddress }> {
  const params: Record<string, string> = {
    action: 'address_add',
    title: data.title,
    full_name: data.full_name,
    phone: data.phone,
    address_line1: data.address_line1,
    city: data.city,
    district: data.district,
    postal_code: data.postal_code,
    is_default: data.is_default ? '1' : '0',
  }
  if (data.address_line2) params.address_line2 = data.address_line2
  return actionPost<{ address: UserAddress }>(params)
}

export async function addressUpdate(id: number, data: Partial<Omit<UserAddress, 'id'>>): Promise<{ address: UserAddress }> {
  const params: Record<string, string> = { action: 'address_update', id: String(id) }
  if (data.title !== undefined) params.title = data.title
  if (data.full_name !== undefined) params.full_name = data.full_name
  if (data.phone !== undefined) params.phone = data.phone
  if (data.address_line1 !== undefined) params.address_line1 = data.address_line1
  if (data.address_line2 !== undefined) params.address_line2 = data.address_line2
  if (data.city !== undefined) params.city = data.city
  if (data.district !== undefined) params.district = data.district
  if (data.postal_code !== undefined) params.postal_code = data.postal_code
  if (data.is_default !== undefined) params.is_default = data.is_default ? '1' : '0'
  return actionPost<{ address: UserAddress }>(params)
}

export async function addressRemove(id: number): Promise<{ success: boolean }> {
  return actionPost<{ success: boolean }>({ action: 'address_remove', id: String(id) })
}

// ==================== Orders ====================

export async function orderList(): Promise<{ orders: Order[] }> {
  return actionPost<{ orders: Order[] }>({ action: 'order_list' })
}

export async function orderDetail(id: number): Promise<{ order: Order }> {
  return actionPost<{ order: Order }>({ action: 'order_detail', id: String(id) })
}

export async function orderCreate(data: {
  items: { product_id: string | number; quantity: number; unit_price: number; has_price: boolean }[]
  address_id: number
  notes?: string
}): Promise<{ order: Order }> {
  return actionPost<{ order: Order }>({
    action: 'order_create',
    items: JSON.stringify(data.items),
    address_id: String(data.address_id),
    ...(data.notes ? { notes: data.notes } : {}),
  })
}

// ==================== Favorites ====================

export async function favoriteList(): Promise<{ favorites: FavoriteProduct[]; products: ShopProduct[] }> {
  return actionPost<{ favorites: FavoriteProduct[]; products: ShopProduct[] }>({ action: 'favorite_list' })
}

export async function favoriteAdd(productId: string | number): Promise<{ success: boolean }> {
  return actionPost<{ success: boolean }>({ action: 'favorite_add', product_id: String(productId) })
}

export async function favoriteRemove(productId: string | number): Promise<{ success: boolean }> {
  return actionPost<{ success: boolean }>({ action: 'favorite_remove', product_id: String(productId) })
}

// ==================== Products (API-driven) ====================

export async function productList(params?: {
  category?: string
  search?: string
  brand?: string
  vehicle_id?: number
  page?: number
  per_page?: number
}): Promise<{ products: ShopProduct[]; total: number; page: number; per_page: number }> {
  const p: Record<string, string> = { action: 'product_list' }
  if (params?.category) p.category = params.category
  if (params?.search) p.search = params.search
  if (params?.brand) p.brand = params.brand
  if (params?.vehicle_id) p.vehicle_id = String(params.vehicle_id)
  if (params?.page) p.page = String(params.page)
  if (params?.per_page) p.per_page = String(params.per_page)
  return actionPost<{ products: ShopProduct[]; total: number; page: number; per_page: number }>(p)
}

export async function productDetail(slug: string): Promise<{ product: ShopProduct }> {
  return actionPost<{ product: ShopProduct }>({ action: 'product_detail', slug })
}

export async function productSearch(query: string): Promise<{ products: ShopProduct[] }> {
  return actionPost<{ products: ShopProduct[] }>({ action: 'product_search', q: query })
}

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

// ==================== Admin ====================

export async function adminProductAdd(data: Record<string, string>): Promise<{ product: ShopProduct }> {
  return actionPost<{ product: ShopProduct }>({ action: 'admin_product_add', ...data })
}

export async function adminProductUpdate(id: number, data: Record<string, string>): Promise<{ product: ShopProduct }> {
  return actionPost<{ product: ShopProduct }>({ action: 'admin_product_update', id: String(id), ...data })
}

export async function adminProductDelete(id: number): Promise<{ success: boolean }> {
  return actionPost<{ success: boolean }>({ action: 'admin_product_delete', id: String(id) })
}

export async function adminOrderList(page?: number, status?: string): Promise<{ orders: Order[]; total: number }> {
  const params: Record<string, string> = { action: 'admin_order_list' }
  if (page) params.page = String(page)
  if (status) params.status = status
  return actionPost<{ orders: Order[]; total: number }>(params)
}

export async function adminOrderUpdateStatus(id: number, status: string): Promise<{ success: boolean }> {
  return actionPost<{ success: boolean }>({ action: 'admin_order_update_status', id: String(id), status })
}

export async function adminEnrichPart(data: {
  oem_number: string
  price?: string
  discount_price?: string
  category?: string
  thumbnail?: string
  name?: string
  in_stock?: string
}): Promise<{ product: ShopProduct; action: 'created' | 'updated' }> {
  const params: Record<string, string> = { action: 'admin_enrich_part', oem_number: data.oem_number }
  if (data.price !== undefined) params.price = data.price
  if (data.discount_price !== undefined) params.discount_price = data.discount_price
  if (data.category !== undefined) params.category = data.category
  if (data.thumbnail !== undefined) params.thumbnail = data.thumbnail
  if (data.name !== undefined) params.name = data.name
  if (data.in_stock !== undefined) params.in_stock = data.in_stock
  return actionPost<{ product: ShopProduct; action: 'created' | 'updated' }>(params)
}
