import type {
  Brand,
  Model,
  Segment,
  ApiResponse,
  AuthResponse,
  GarageVehicle,
  User,
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

export async function getBrands(popular?: boolean): Promise<Brand[]> {
  const params = popular ? '?popular=1' : ''
  const res = await fetchApi<ApiResponse<Brand[]>>(`/brands${params}`)
  return res.data
}

// ==================== Models ====================

export async function getModels(brandId: number): Promise<Model[]> {
  const res = await fetchApi<ApiResponse<Model[]>>(`/models?brand_id=${brandId}`)
  return res.data
}

// ==================== Segments ====================

export async function getSegments(modelId: number): Promise<Segment[]> {
  const res = await fetchApi<ApiResponse<Segment[]>>(`/segments?model_id=${modelId}`)
  return res.data
}

// ==================== Years ====================

export async function getYears(segmentId: number): Promise<number[]> {
  const res = await fetchApi<ApiResponse<number[]>>(`/years?segment_id=${segmentId}`)
  return res.data
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

// ==================== Garage ====================

export async function getGarageVehicles(): Promise<GarageVehicle[]> {
  const res = await fetchApi<ApiResponse<GarageVehicle[]>>('/garage/list')
  return res.data
}

export async function addGarageVehicle(data: {
  brand_id: number
  model_id: number
  segment_id?: number
  year: number
  nickname?: string
}): Promise<{ message: string }> {
  return fetchApi('/garage/add', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function removeGarageVehicle(id: number): Promise<{ message: string }> {
  return fetchApi(`/garage/remove?id=${id}`, {
    method: 'DELETE',
  })
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

export interface VehiclePart {
  oem_number: string
  name: string
  brand_slug?: string
  generation_slug?: string
  node_name_en?: string
}

export interface OemSearchResult {
  oem_number: string
  name: string
  brand_slug: string
  generation_slug: string
  node_name_en: string
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

export function fetchVehicleCategories(brand: string, gen: string) {
  return actionFetch<{ categories: VehicleCategory[]; total_parts: number }>({
    action: 'categories', brand, gen,
  })
}

export function fetchVehicleNodes(brand: string, gen: string, cat: string) {
  return actionFetch<{ nodes: VehicleNode[] }>({ action: 'nodes', brand, gen, cat })
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
