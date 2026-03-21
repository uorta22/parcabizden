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
  is_admin?: boolean
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
  spec_id: number | null
  plaka: string | null
  sase_no: string | null
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

export interface VehicleSpecRow {
  id: number
  brand: string
  model: string
  generation: string
  modification: string
  year_start: number | null
  year_end: number | null
  body_type: string | null
  fuel_type: string | null
  engine_cc: number | null
  cylinders: number | null
  power_hp: number | null
  torque_nm: number | null
  transmission: string | null
  drivetrain: string | null
  top_speed_kmh: number | null
  accel_0_100: number | null
  fuel_combined: number | null
  length_mm: number | null
  width_mm: number | null
  height_mm: number | null
  wheelbase_mm: number | null
  weight_kg: number | null
  trunk_liters: number | null
  fuel_tank_liters: number | null
  doors: number | null
  seats: number | null
}

export interface VehicleSpecModel {
  model: string
  generation: string
  mod_count: number
}

export interface AutodataBrand {
  name: string
  slug: string
  model_count: number
  total: number
}

export interface AutodataModel {
  name: string
  gen_count: number
  min_year: number | null
  max_year: number | null
  sub_models?: string[]
}

export interface AutodataGeneration {
  name: string
  year_start: number | null
  year_end: number | null
  body_type: string | null
  mod_count: number
}

export interface SlugMatch {
  generation_slug: string
  generation_name: string
  part_count: number
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

// ==================== Extended User & Account ====================

export interface UserProfile extends User {
  gsm?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  district?: string | null
  postal_code?: string | null
  tc_no?: string | null
}

export interface UserAddress {
  id: number
  title: string
  full_name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  district: string
  postal_code: string
  is_default: boolean
}

// ==================== Orders ====================

export interface Order {
  id: number
  order_no: string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  items: OrderItem[]
  total_price: number
  address?: UserAddress
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  product_id: string
  product_name: string
  product_image?: string
  quantity: number
  unit_price: number
  has_price: boolean
}

// ==================== Favorites ====================

export interface FavoriteProduct {
  id: number
  product_id: string
  added_at: string
}
