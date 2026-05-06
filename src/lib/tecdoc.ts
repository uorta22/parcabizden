/**
 * TecDoc API Client — ID tabanlı temiz zincir
 *
 * Backend: php-backend/tecdoc.php (action=tecdoc_*)
 * Veri zinciri:
 *   marka (manufacturer) → model → araç (vehicle/KType) → kategori → parça
 *
 * Tüm fonksiyonlar deterministik ID üzerinden çalışır,
 * fuzzy/slug matching YOKTUR.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.parcabizden.com.tr'

// ==================== Tipler ====================

export interface TecBrand {
  id: number
  name: string
  matchcode: string | null
  /** popüler markalarda gelir, jeneriklikte 0 */
  model_count?: number
}

export interface TecModel {
  id: number
  manufacturer_id: number
  name: string
  full_name: string | null
  year_range: string | null
}

export interface TecVehicle {
  /** KType — TecDoc araç ID'si */
  id: number
  model_id: number
  description: string | null
  full_name: string | null
  year_from: number | null
  year_to: number | null
  /** virgüllü liste, örn. "BKD, AZV, BLB" */
  engine_codes: string | null
}

export interface TecAttributeGroups {
  vehicle_id: number
  groups: Record<string, Array<{ title: string | null; value: string | null }>>
}

export interface TecCategoryNode {
  id: number
  description_tr: string | null
  description_en: string | null
  part_count: number
}

export interface TecCategoriesResponse {
  vehicle_id: number
  /** Üst gruba göre ağaç: "Fren Sistemi" → [{id, description_tr, ...}, ...] */
  tree: Record<string, TecCategoryNode[]>
  flat: Array<{
    id: number
    assembly_group_tr: string | null
    assembly_group_en: string | null
    description_tr: string | null
    description_en: string | null
    part_count: number
  }>
}

export interface TecPartImage {
  /** Mutlak URL (uploads/ ile başlar). Yüklenmemişse null. */
  url: string | null
  name: string | null
  type: string
}

export interface TecPart {
  id: number
  supplier_id: number
  part_number: string
  supplier_name: string | null
  supplier_matchcode?: string | null
  /** Tüm bilinen görseller (yüklü + bilinen ama upload bekleyen) */
  images?: TecPartImage[]
  /** Kart kapak görseli (ilk yüklenmiş resim) — yoksa null */
  cover_url?: string | null
}

export interface TecPartsResponse {
  vehicle_id: number
  category_id: number
  parts: TecPart[]
  page: number
  limit: number
  total: number
  has_more: boolean
}

export interface TecPartDetail extends TecPart {
  images: TecPartImage[]
  cross_references: Array<{
    ref_supplier_id: number
    ref_part_number: string
    ref_supplier_name: string | null
    ref_type: string
  }>
  compatible_vehicles: Array<{
    id: number
    description: string | null
    year_from: number | null
    year_to: number | null
    model_name: string
    manufacturer_name: string
  }>
}

// ==================== Helper ====================

async function tdFetch<T>(action: string, params: Record<string, string | number> = {}): Promise<T> {
  const search = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) })
  // Browser HTTP cache'ini açıyoruz; backend zaten 'Cache-Control: public, max-age=3600'
  // dönüyor, böylece marka/model gibi statik veriler tekrar tekrar DB'ye gitmiyor.
  const res = await fetch(`${API_BASE}/?${search.toString()}`)
  if (!res.ok) throw new Error(`TecDoc API error: ${res.status}`)
  const data = await res.json()
  if (data?.error) throw new Error(data.error)
  return data as T
}

// Backend bazı sayısal alanları string olarak döndürebilir (PDO default).
// Tüm ID'leri her zaman number'a normalize ediyoruz.
function toInt(v: unknown): number {
  return typeof v === 'number' ? v : parseInt(String(v ?? '0'), 10) || 0
}
function toIntOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = parseInt(String(v), 10)
  return Number.isNaN(n) ? null : n
}

// ==================== Endpoints ====================

/** Tüm TecDoc markaları. popular=true → model sayısına göre top 30. */
export async function getTecBrands(popular = false): Promise<TecBrand[]> {
  const data = await tdFetch<{ brands: any[] }>('tecdoc_brands', popular ? { popular: 1 } : {})
  return data.brands.map(b => ({
    id: toInt(b.id),
    name: b.name,
    matchcode: b.matchcode ?? null,
    model_count: b.model_count !== undefined ? toInt(b.model_count) : undefined,
  }))
}

/** Markaya ait modeller. */
export async function getTecModels(manufacturerId: number): Promise<TecModel[]> {
  const data = await tdFetch<{ models: any[] }>('tecdoc_models', { manufacturer_id: manufacturerId })
  return data.models.map(m => ({
    id: toInt(m.id),
    manufacturer_id: toInt(m.manufacturer_id),
    name: m.name,
    full_name: m.full_name ?? null,
    year_range: m.year_range ?? null,
  }))
}

/** Modele ait varyantlar (KType araçlar). */
export async function getTecVehicles(modelId: number): Promise<TecVehicle[]> {
  const data = await tdFetch<{ vehicles: any[] }>('tecdoc_vehicles', { model_id: modelId })
  return data.vehicles.map(v => ({
    id: toInt(v.id),
    model_id: toInt(v.model_id),
    description: v.description ?? null,
    full_name: v.full_name ?? null,
    year_from: toIntOrNull(v.year_from),
    year_to: toIntOrNull(v.year_to),
    engine_codes: v.engine_codes ?? null,
  }))
}

/** Aracın teknik özellikleri (group → [{title, value}, ...]). */
export async function getTecVehicleAttributes(vehicleId: number): Promise<TecAttributeGroups> {
  return await tdFetch<TecAttributeGroups>('tecdoc_vehicle_attributes', { vehicle_id: vehicleId })
}

/** Araca uyan parça kategorileri (assembly_group altında nest). */
export async function getTecVehicleCategories(vehicleId: number): Promise<TecCategoriesResponse> {
  const data = await tdFetch<any>('tecdoc_vehicle_categories', { vehicle_id: vehicleId })
  return {
    vehicle_id: toInt(data.vehicle_id),
    tree: Object.fromEntries(
      Object.entries(data.tree || {}).map(([group, nodes]: [string, any]) => [
        group,
        (nodes as any[]).map(n => ({
          id: toInt(n.id),
          description_tr: n.description_tr ?? null,
          description_en: n.description_en ?? null,
          part_count: toInt(n.part_count),
        })),
      ])
    ),
    flat: (data.flat || []).map((c: any) => ({
      id: toInt(c.id),
      assembly_group_tr: c.assembly_group_tr ?? null,
      assembly_group_en: c.assembly_group_en ?? null,
      description_tr: c.description_tr ?? null,
      description_en: c.description_en ?? null,
      part_count: toInt(c.part_count),
    })),
  }
}

/** Araca + kategoriye uyan parçalar (sayfalı). */
export async function getTecVehicleParts(
  vehicleId: number,
  categoryId: number,
  page = 1,
  limit = 50
): Promise<TecPartsResponse> {
  const data = await tdFetch<any>('tecdoc_vehicle_parts', {
    vehicle_id: vehicleId,
    category_id: categoryId,
    page,
    limit,
  })
  return {
    vehicle_id: toInt(data.vehicle_id),
    category_id: toInt(data.category_id),
    page: toInt(data.page),
    limit: toInt(data.limit),
    total: toInt(data.total),
    has_more: !!data.has_more,
    parts: (data.parts || []).map((p: any) => ({
      id: toInt(p.id),
      supplier_id: toInt(p.supplier_id),
      part_number: p.part_number,
      supplier_name: p.supplier_name ?? null,
      supplier_matchcode: p.supplier_matchcode ?? null,
      images: Array.isArray(p.images) ? p.images.map((i: any) => ({
        url: i.url ? absoluteImageUrl(i.url) : null,
        name: i.name ?? null,
        type: i.type ?? 'Picture',
      })) : [],
      cover_url: p.cover_url ? absoluteImageUrl(p.cover_url) : null,
    })),
  }
}

/** Backend göreceli (/uploads/...) yol döndürürse, mutlaka API_BASE'i ön eke ekle. */
function absoluteImageUrl(p: string): string {
  if (/^https?:\/\//i.test(p)) return p
  return `${API_BASE}${p.startsWith('/') ? '' : '/'}${p}`
}

/** OEM/parça numarası ile arama. */
export async function searchTecParts(q: string): Promise<TecPart[]> {
  if (q.trim().length < 3) return []
  const data = await tdFetch<{ results: any[] }>('tecdoc_search', { q: q.trim() })
  return (data.results || []).map(r => ({
    id: toInt(r.id),
    supplier_id: toInt(r.supplier_id),
    part_number: r.part_number,
    supplier_name: r.supplier_name ?? null,
  }))
}

/** Parça detayı: cross-ref + uyumlu araçlar + görseller. */
export async function getTecPartDetail(partId: number): Promise<TecPartDetail> {
  const data = await tdFetch<{ part: any }>('tecdoc_part_detail', { part_id: partId })
  const p = data.part
  return {
    id: toInt(p.id),
    supplier_id: toInt(p.supplier_id),
    part_number: p.part_number,
    supplier_name: p.supplier_name ?? null,
    supplier_matchcode: p.supplier_matchcode ?? null,
    images: Array.isArray(p.images) ? p.images.map((i: any) => ({ name: i.picture_name ?? i.name, type: i.doc_type ?? i.type })) : [],
    cross_references: (p.cross_references || []).map((c: any) => ({
      ref_supplier_id: toInt(c.ref_supplier_id),
      ref_part_number: c.ref_part_number,
      ref_supplier_name: c.ref_supplier_name ?? null,
      ref_type: c.ref_type,
    })),
    compatible_vehicles: (p.compatible_vehicles || []).map((v: any) => ({
      id: toInt(v.id),
      description: v.description ?? null,
      year_from: toIntOrNull(v.year_from),
      year_to: toIntOrNull(v.year_to),
      model_name: v.model_name,
      manufacturer_name: v.manufacturer_name,
    })),
  }
}

// ==================== TecDoc Görsel URL'i ====================

/**
 * Natro'da /api.parcabizden.com.tr/uploads/ altında görseller var.
 * picture_name → doğrudan URL eşlemesi.
 */
export function tecPartImageUrl(pictureName: string): string {
  // Backend tarafında resolved path'i frontend'de tahmin etmek yerine
  // doğrudan kullan. Eğer Natro'da farklı bir alt yol varsa bu fonksiyonu güncelle.
  const base = process.env.NEXT_PUBLIC_TECDOC_IMAGES_URL || `${API_BASE}/uploads`
  return `${base}/${pictureName}`
}
