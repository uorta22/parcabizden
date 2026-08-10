/**
 * part-parser — talep yüzeyinin "yaz → yapı çıkar → onayla" akışı için ince katman.
 *
 * smart-search.ts (PART_KEYWORDS, BRAND_KEYWORDS, parseSmartQuery) ve
 * oem-prefix.ts (guessOemBrand) ÜZERİNE kurulur, hiçbirini değiştirmez.
 * Buradaki tek iş: serbest metin / VIN / OEM girdisini kullanıcıya gösterilecek
 * düzenlenebilir "chip"lere çevirmek. Ayrıştırma asla engelleyici değildir —
 * hiçbir şey eşleşmezse ParsedInput boş döner, çağıran taraf ham metni
 * olduğu gibi göndermeye devam edebilir.
 */

import { PART_KEYWORDS, BRAND_KEYWORDS, parseSmartQuery } from './smart-search'
import { guessOemBrand } from './oem-prefix'
import { decodeVIN, validateVIN } from './vehicle'
import { getTecBrands, getTecModels, type TecBrand, type TecModel } from './tecdoc'

export type InputKind = 'vin' | 'oem' | 'free'

export interface VehicleGuess {
  /** Gösterim etiketi, örn. "BMW (E60)" / "Volkswagen Golf" */
  label: string
  brandSlug: string | null
  /** parseSmartQuery'nin eşleştirdiği ham model anahtarı (varsa) — örn. "e60", "golf" */
  modelKey: string | null
  source: InputKind
}

export interface PartGuess {
  /** Gösterim etiketi, örn. "Turbo", "Fren Balata" */
  label: string
  /** Eşleşen Türkçe anahtar — kaldırma/dedupe için */
  key: string
}

export interface ParsedInput {
  kind: InputKind
  vehicle: VehicleGuess | null
  parts: PartGuess[]
  oemNumber: string | null
  vin: string | null
}

/** Girilen metin türünü otomatik tespit eder — kullanıcı sekme seçmez. */
export function detectInputKind(raw: string): InputKind {
  const trimmed = raw.trim()
  if (!trimmed || /\s/.test(trimmed)) return 'free'

  if (trimmed.length === 17 && validateVIN(trimmed)) return 'vin'

  if (
    trimmed.length >= 6 && trimmed.length <= 20 &&
    /[A-Za-z]/.test(trimmed) && /\d/.test(trimmed) &&
    /^[A-Za-z0-9-]+$/.test(trimmed)
  ) {
    return 'oem'
  }

  return 'free'
}

const BRAND_DISPLAY: Record<string, string> = {
  volkswagen: 'Volkswagen', audi: 'Audi', bmw: 'BMW', 'mercedes-benz': 'Mercedes-Benz',
  renault: 'Renault', fiat: 'Fiat', ford: 'Ford', opel: 'Opel', toyota: 'Toyota',
  honda: 'Honda', hyundai: 'Hyundai', peugeot: 'Peugeot', citroen: 'Citroën',
  dacia: 'Dacia', skoda: 'Škoda', seat: 'SEAT', volvo: 'Volvo', nissan: 'Nissan',
  kia: 'Kia', suzuki: 'Suzuki', mazda: 'Mazda', 'alfa-romeo': 'Alfa Romeo',
  mini: 'MINI', porsche: 'Porsche', jeep: 'Jeep', 'land-rover': 'Land Rover',
  subaru: 'Subaru', mitsubishi: 'Mitsubishi', chevrolet: 'Chevrolet', chrysler: 'Chrysler',
}

function brandDisplayName(slug: string): string {
  return BRAND_DISPLAY[slug] ?? (slug.charAt(0).toUpperCase() + slug.slice(1))
}

function titleCaseTr(text: string): string {
  return text.replace(/(^|\s)([a-zçğıöşü])/g, (_, sep, ch) => sep + ch.toUpperCase())
}

/** "e60", "w204", "t5" gibi şasi/nesil kodları */
function isChassisCode(key: string): boolean {
  return /^[a-z]\d{1,3}$/i.test(key)
}

function vehicleLabelFor(brandSlug: string, modelKey: string | null): string {
  const brand = brandDisplayName(brandSlug)
  if (!modelKey) return brand
  if (isChassisCode(modelKey)) return `${brand} (${modelKey.toUpperCase()})`
  return `${brand} ${titleCaseTr(modelKey)}`
}

/**
 * PART_KEYWORDS üzerinde kendi eşleşmemizi yapar — parseSmartQuery yalnızca
 * İngilizce karşılıkları döndürüyor, biz kullanıcıya Türkçe etiket göstermek
 * istiyoruz. En uzun eşleşme önce denenir; daha uzun bir anahtarın parçası
 * olan kısa anahtarlar (ör. "fren diski" varken "fren") elenir.
 */
function matchPartKeywordsTr(text: string): PartGuess[] {
  const sortedKeys = Object.keys(PART_KEYWORDS).sort((a, b) => b.length - a.length)
  const accepted: string[] = []

  for (const key of sortedKeys) {
    if (!text.includes(key)) continue
    if (accepted.some(a => a.includes(key))) continue
    accepted.push(key)
  }

  return accepted.map(key => ({ key, label: titleCaseTr(key) }))
}

/** Serbest metin / VIN / OEM girdisini chip modeline çevirir. Asla fırlatmaz. */
export function parseInput(raw: string): ParsedInput {
  const kind = detectInputKind(raw)
  const trimmed = raw.trim()

  if (kind === 'vin') {
    return { kind, vehicle: null, parts: [], oemNumber: null, vin: trimmed.toUpperCase() }
  }

  if (kind === 'oem') {
    const guess = guessOemBrand(trimmed)
    const vehicle: VehicleGuess | null = guess
      ? { label: `${guess.brand} (tahmini)`, brandSlug: guess.brandSlug, modelKey: null, source: 'oem' }
      : null
    return { kind, vehicle, parts: [], oemNumber: trimmed.toUpperCase(), vin: null }
  }

  const normalized = trimmed.toLowerCase()
  const smart = parseSmartQuery(normalized)
  const vehicle: VehicleGuess | null = smart.brand
    ? { label: vehicleLabelFor(smart.brand, smart.model), brandSlug: smart.brand, modelKey: smart.model, source: 'free' }
    : null

  return { kind, vehicle, parts: matchPartKeywordsTr(normalized), oemNumber: null, vin: null }
}

/** VIN'i backend'e sorup VehicleGuess'e çevirir. Bulunamazsa null döner. */
export async function decodeVinVehicle(vin: string): Promise<VehicleGuess | null> {
  const { data } = await decodeVIN(vin)
  if (!data || (!data.make && !data.model)) return null

  const label = [data.make, data.model, data.year].filter(Boolean).join(' ')
  return {
    label: label || vin,
    brandSlug: data.brandSlug ?? null,
    modelKey: data.model || null,
    source: 'vin',
  }
}

export interface ResolvedVehicleIds {
  manufacturerId: number
  modelId: number
  brand: TecBrand
  model: TecModel
}

/**
 * TecDoc kataloğunda marka/model ID'sini bulmayı dener — talebi doğru
 * satıcılara hedeflemek için bonus bir adım, tutmazsa akış engellenmez.
 */
export async function resolveVehicleIds(guess: VehicleGuess): Promise<ResolvedVehicleIds | null> {
  if (!guess.brandSlug) return null

  try {
    const brands = await getTecBrands()
    const brandDisplay = brandDisplayName(guess.brandSlug).toLowerCase()
    const brand = brands.find(b => b.name.toLowerCase() === brandDisplay)
      ?? brands.find(b => b.name.toLowerCase().includes(guess.brandSlug!.replace('-', ' ')))
    if (!brand) return null
    if (!guess.modelKey) return null

    const models = await getTecModels(brand.id)
    const modelKey = guess.modelKey.toLowerCase()
    const model = models.find(m =>
      m.name.toLowerCase().includes(modelKey) ||
      (m.full_name?.toLowerCase().includes(modelKey) ?? false)
    )
    if (!model) return null

    return { manufacturerId: brand.id, modelId: model.id, brand, model }
  } catch {
    return null
  }
}
