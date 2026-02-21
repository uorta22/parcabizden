// ═══ Otomotiv Marka Grupları & Yardımcı Fonksiyonlar ═══

export interface BrandGroup {
  name: string
  brands: string[]
}

export const BRAND_GROUPS: BrandGroup[] = [
  { name: 'VAG (Volkswagen Group)', brands: ['volkswagen', 'audi', 'seat', 'skoda', 'porsche', 'bentley', 'lamborghini', 'cupra'] },
  { name: 'Stellantis', brands: ['peugeot', 'citroen', 'opel', 'fiat', 'alfa-romeo', 'jeep', 'chrysler', 'dodge', 'lancia', 'ds', 'maserati'] },
  { name: 'BMW Group', brands: ['bmw', 'mini', 'rolls-royce'] },
  { name: 'Mercedes-Benz Group', brands: ['mercedes-benz', 'mercedes', 'smart'] },
  { name: 'Hyundai-Kia', brands: ['hyundai', 'kia', 'genesis'] },
  { name: 'Toyota Group', brands: ['toyota', 'lexus'] },
  { name: 'Renault Group', brands: ['renault', 'dacia', 'nissan'] },
  { name: 'Ford Group', brands: ['ford', 'lincoln'] },
  { name: 'GM (General Motors)', brands: ['chevrolet', 'cadillac', 'gmc', 'buick'] },
  { name: 'Honda Group', brands: ['honda', 'acura'] },
  { name: 'Geely Group', brands: ['volvo', 'geely', 'lynk-co', 'polestar'] },
]

/**
 * Verilen marka slug listesinden ortak bir otomotiv grubunu tespit eder.
 * Eğer tüm markalar aynı gruba aitse grup adını döner, aksi halde null.
 */
export function findBrandGroup(brandSlugs: string[]): string | null {
  if (brandSlugs.length === 0) return null

  const normalized = brandSlugs.map(s => s.toLowerCase().replace(/\s+/g, '-'))

  for (const group of BRAND_GROUPS) {
    const matching = normalized.filter(b => group.brands.includes(b))
    if (matching.length >= 2) return group.name
  }
  return null
}

/**
 * Marka slug'ını okunabilir isme dönüştürür.
 * Örn: "volkswagen" → "Volkswagen", "alfa-romeo" → "Alfa Romeo", "bmw" → "BMW"
 */
export function formatBrandSlug(slug: string): string {
  const SPECIAL: Record<string, string> = {
    'bmw': 'BMW',
    'gmc': 'GMC',
    'ds': 'DS',
    'mg': 'MG',
    'byd': 'BYD',
  }

  const lower = slug.toLowerCase()
  if (SPECIAL[lower]) return SPECIAL[lower]

  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export interface ParsedGeneration {
  model: string
  chassis: string
  year: string
  raw: string
}

/**
 * generation_slug'ı parse ederek model adı, kasa kodu ve yılı çıkarır.
 * Örn: "golf-4-1j-1998" → { model: "Golf 4", chassis: "1J", year: "1998" }
 * Örn: "a4-b6-2001" → { model: "A4", chassis: "B6", year: "2001" }
 * Örn: "3-series-e46-1998" → { model: "3 Series", chassis: "E46", year: "1998" }
 */
export function parseGenerationSlug(slug: string): ParsedGeneration {
  const parts = slug.split('-')
  const raw = slug

  // Son eleman yıl ise ayır
  let year = ''
  if (parts.length > 1 && /^\d{4}$/.test(parts[parts.length - 1])) {
    year = parts.pop()!
  }

  // Kasa kodu: genellikle 1-3 karakter, harf+rakam veya sadece harf (E46, B6, 1J, W205, MK7 vb.)
  let chassis = ''
  if (parts.length > 1) {
    const last = parts[parts.length - 1]
    // Kasa kodu patternleri: E46, B6, 1J, W205, MK7, PQ35 vb.
    if (/^[a-z]{0,2}\d{1,3}[a-z]?$/i.test(last) || /^[a-z]{1,2}\d{0,3}$/i.test(last)) {
      // Eğer bu sadece bir sayı ise (model numarasının parçası olabilir: "golf-4") kasa kodu olarak alma
      if (!/^\d+$/.test(last)) {
        chassis = parts.pop()!.toUpperCase()
      }
    }
  }

  // Geri kalan model adı
  const model = parts
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return { model, chassis, year, raw }
}
