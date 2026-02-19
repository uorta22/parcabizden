import type {
  Brand,
  Model,
  Segment,
  ApiCategory,
  ApiPart,
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

// ==================== Categories ====================

export async function getCategories(): Promise<ApiCategory[]> {
  const res = await fetchApi<ApiResponse<ApiCategory[]>>('/categories')
  return res.data
}

// ==================== Parts ====================

interface PartsParams {
  category?: string
  brand_id?: number
  model_id?: number
  year?: number
  page?: number
}

export async function getParts(params: PartsParams): Promise<ApiResponse<ApiPart[]>> {
  const searchParams = new URLSearchParams()
  if (params.category) searchParams.set('category', params.category)
  if (params.brand_id) searchParams.set('brand_id', String(params.brand_id))
  if (params.model_id) searchParams.set('model_id', String(params.model_id))
  if (params.year) searchParams.set('year', String(params.year))
  if (params.page) searchParams.set('page', String(params.page))

  return fetchApi<ApiResponse<ApiPart[]>>(`/parts?${searchParams.toString()}`)
}

// ==================== Search ====================

export async function searchParts(query: string, page = 1): Promise<ApiResponse<ApiPart[]>> {
  return fetchApi<ApiResponse<ApiPart[]>>(`/search?q=${encodeURIComponent(query)}&page=${page}`)
}

// ==================== Auth ====================

export async function register(email: string, password: string, name: string, phone?: string): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, phone }),
  })
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function getProfile(): Promise<User> {
  const res = await fetchApi<ApiResponse<User>>('/auth/profile')
  return res.data
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

export function searchOemParts(query: string) {
  return actionFetch<{ results: OemSearchResult[]; query: string }>({
    action: 'search_oem', q: query,
  })
}
