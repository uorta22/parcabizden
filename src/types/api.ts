// API Response Types

export interface Brand {
  id: number
  name: string
  logo_file: string | null
}

export interface Model {
  id: number
  name: string
}

export interface Segment {
  id: number
  name: string
  year_start: number
  year_end: number
  body_type: string | null
  engine_type: string | null
}

export interface ApiCategory {
  id: number
  slug: string
  name: string
  description: string | null
  icon: string | null
  part_count: number
}

export interface ApiPart {
  id: number
  oem_number: string | null
  name: string
  description: string | null
  part_type: 'yedek' | 'cikma' | 'both'
  position: string | null
  category_slug: string
  category_name: string
}

export interface User {
  id: number
  email: string
  name: string
  phone?: string | null
}

export interface GarageVehicle {
  id: number
  year: number
  nickname: string | null
  created_at: string
  brand_id: number
  brand_name: string
  brand_logo: string | null
  model_id: number
  model_name: string
  segment_id: number | null
  segment_name: string | null
  body_type: string | null
  engine_type: string | null
}

export interface GarageVehicleNatro {
  id: number
  brand_slug: string
  brand_name: string
  generation_slug: string
  generation_name: string
  year: number | null
  nickname: string | null
  current_km: number | null
  km_updated_at: string | null
  notes: string | null
  overdue_count: number
  upcoming_count: number
  total_maintenance: number
  created_at: string
}

export interface MaintenanceRecord {
  id: number
  garage_id: number
  maintenance_type: string
  done_km: number | null
  done_date: string | null
  next_km: number | null
  next_date: string | null
  notes: string | null
  created_at: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface ApiResponse<T> {
  data: T
  pagination?: Pagination
  error?: string
  message?: string
}

export interface AuthResponse {
  message: string
  token: string
  user: User
}
