interface VehicleModel {
  key: string
  name: string
  slug: string
  image: string
}

interface BrandData {
  id: number
  body_types: Record<string, VehicleModel[]>
  total_models: number
}

type VehicleTree = Record<string, BrandData>

let cachedTree: VehicleTree | null = null

export async function loadVehicleTree(): Promise<VehicleTree> {
  if (cachedTree) return cachedTree
  const res = await fetch('/data/vehicle-tree.json')
  if (!res.ok) throw new Error('Vehicle tree yuklenemedi')
  cachedTree = await res.json()
  return cachedTree!
}

const BRAND_SLUG_TO_NAME: Record<string, string> = {
  'alfa-romeo': 'Alfa Romeo',
  'mercedes-benz': 'Mercedes-Benz',
  'land-rover': 'Land Rover',
}

function brandSlugToTreeKey(brandSlug: string): string {
  if (BRAND_SLUG_TO_NAME[brandSlug]) return BRAND_SLUG_TO_NAME[brandSlug]
  return brandSlug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function findVehicleImage(
  tree: VehicleTree,
  brandSlug: string,
  generationSlug: string
): string | null {
  // Try to find the brand key in tree
  const tryKey = brandSlugToTreeKey(brandSlug)
  const brand = tree[tryKey]
    || Object.values(tree).find((_, i) => {
      const k = Object.keys(tree)[i]
      return k.toLowerCase().replace(/\s+/g, '-') === brandSlug
    })

  if (!brand) return null

  // Search all body_types for matching generation slug
  for (const models of Object.values(brand.body_types)) {
    for (const model of models) {
      if (model.slug === generationSlug) {
        return model.image
      }
    }
  }

  // Partial match: generation_slug starts with or contains model slug
  for (const models of Object.values(brand.body_types)) {
    for (const model of models) {
      if (generationSlug.startsWith(model.slug.split('_')[0]) || model.slug.startsWith(generationSlug.split('_')[0])) {
        return model.image
      }
    }
  }

  return null
}

// ==================== Autodata Image Lookup ====================

interface AutodataImageEntry {
  brand: string
  model: string
  generation: string
  thumb: string
  image: string
}

const brandImageCache = new Map<string, AutodataImageEntry[]>()

function brandSlug(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function loadBrandImages(brandName: string): Promise<AutodataImageEntry[]> {
  const slug = brandSlug(brandName)
  const cached = brandImageCache.get(slug)
  if (cached) return cached
  try {
    const res = await fetch(`/data/images/${slug}.json`)
    if (!res.ok) { brandImageCache.set(slug, []); return [] }
    const data: AutodataImageEntry[] = await res.json()
    brandImageCache.set(slug, data)
    return data
  } catch {
    brandImageCache.set(slug, [])
    return []
  }
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Almanca/İngilizce/Türkçe model suffix'lerini standartlaştır
// "C-Klasse" → "c", "C-Serisi" → "c", "C-Class" → "c", "3 Series" → "3"
function stripModelSuffix(s: string): string {
  return s
    .replace(/[-\s]?(klasse|serisi|series|class|reihe)\b/gi, '')
    .replace(/[-\s]?(sedan|hatchback|wagon|touring|coupe|cabrio|cabriolet|roadster|sportback|avant|kombi|station\s*wagon)\b/gi, '')
    .trim()
}

// Extract parenthesized and non-parenthesized parts
function extractParts(s: string): string[] {
  const parts: string[] = []
  const parenMatch = s.match(/\(([^)]+)\)/g)
  if (parenMatch) {
    for (const m of parenMatch) parts.push(m.slice(1, -1).trim())
  }
  const withoutParen = s.replace(/\([^)]*\)/g, '').trim()
  if (withoutParen) parts.push(withoutParen)
  return parts
}

export async function findAutodataImage(
  brandName: string,
  modelOrGeneration?: string
): Promise<string | null> {
  const brandMatches = await loadBrandImages(brandName)
  if (brandMatches.length === 0) return null

  if (!modelOrGeneration) {
    return brandMatches[0].image
  }

  const searchNorm = normalize(modelOrGeneration)
  const searchParts = extractParts(modelOrGeneration).map(normalize)
  const brandNorm = normalize(brandName)

  // Generation'lardan marka prefixini cikaran yardimci
  const stripBrand = (s: string) => {
    const n = normalize(s)
    return n.startsWith(brandNorm) ? n.slice(brandNorm.length) : n
  }

  // Exact generation match (marka prefiksi ile ve prefikssiz)
  for (const img of brandMatches) {
    const genNorm = normalize(img.generation)
    if (genNorm === searchNorm || stripBrand(img.generation) === searchNorm) return img.image
  }

  // Cross-match: search parts against generation name (normalized, full string)
  const genNormFull = brandMatches.map(img => ({ img, norm: normalize(img.generation), stripped: stripBrand(img.generation) }))
  for (const sp of searchParts) {
    if (sp.length < 5) continue
    for (const { img, norm, stripped } of genNormFull) {
      // Hem tam hem de marka-prefikssiz generation'da ara
      for (const target of [norm, stripped]) {
        const idx = target.indexOf(sp)
        if (idx === -1) continue
        // Romen rakami sinir kontrolu (focusii != focusiii)
        const after = target[idx + sp.length]
        if (after && /[ivx0-9]/.test(after) && /[ivx0-9]/.test(sp[sp.length - 1])) continue
        return img.image
      }
    }
  }

  // Partial model name match — startsWith (her iki yonlu)
  for (const img of brandMatches) {
    const modelNorm = normalize(img.model)
    if (modelNorm.startsWith(searchNorm) || searchNorm.startsWith(modelNorm)) return img.image
  }

  // Suffix-stripped match — "C-Klasse" ↔ "C-Serisi" ↔ "C-Class"
  const searchStripped = normalize(stripModelSuffix(modelOrGeneration.replace(/\([^)]*\)/g, '')))
  if (searchStripped.length >= 1) {
    for (const img of brandMatches) {
      const modelStripped = normalize(stripModelSuffix(img.model))
      if (modelStripped === searchStripped) return img.image
      // Autodata model adı yıl içerir ("A-Serisi 1997 -"), sadece model kısmını al
      const modelBase = normalize(stripModelSuffix(img.model.replace(/\d{4}\s*-?\s*\d{0,4}\s*$/, '').trim()))
      if (modelBase === searchStripped) return img.image
    }
  }

  // Brand-stripped generation match — kisa model isimleri icin (orn: "02")
  for (const { img, stripped } of genNormFull) {
    if (stripped.startsWith(searchNorm) || searchNorm.startsWith(stripped)) return img.image
  }

  // Fallback: first word match — minimum 4 chars + startsWith
  const firstWord = searchNorm.slice(0, Math.max(4, searchNorm.indexOf(' ') > 0 ? searchNorm.indexOf(' ') : searchNorm.length))
  if (firstWord.length >= 4) {
    for (const img of brandMatches) {
      if (normalize(img.model).startsWith(firstWord) || normalize(img.generation).startsWith(firstWord)) return img.image
    }
  }

  return null
}

// Model bazlı görsel cache — aynı marka+model için tek görsel kullan
const modelImageCache = new Map<string, string | null>()

function extractModelName(generationName: string): string {
  // "Egea (357) HB / CROSS (2016->)" → "egea"
  // "3 Serisi Sedan (G20N)(2022->)" → "3serisi" → "3"
  // "C-Klasse (204)(2007->)" → "c"
  // "Golf II (191/193)(08.1983-1992)" → "golf"
  // "CR-V (2016->)" → "crv"
  const cleaned = generationName
    .replace(/\([^)]*\)/g, '') // Parantez içini kaldır
    .replace(/\d{4}\s*-?>?\s*\d{0,4}/g, '') // Yılları kaldır
    .replace(/[IVXLC]+$/i, '') // Sonundaki romen rakamlarını kaldır
    .trim()
  // Suffix'leri kaldır (Klasse, Serisi, Class, Series vs.)
  const strippedSuffix = stripModelSuffix(cleaned)
  // İlk kelimeyi al (model adı)
  const firstWord = strippedSuffix.split(/[\s/]+/)[0]
  return firstWord.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export async function findAutodataGenerationImage(
  brandName: string,
  generationName: string
): Promise<string | null> {
  // Model bazlı cache key
  const modelName = extractModelName(generationName)
  const cacheKey = `${normalize(brandName)}_${modelName}`

  if (modelImageCache.has(cacheKey)) {
    return modelImageCache.get(cacheKey)!
  }

  // 1. Try autodata per-brand JSON
  const autodataResult = await findAutodataImage(brandName, generationName)
  if (autodataResult) {
    modelImageCache.set(cacheKey, autodataResult)
    return autodataResult
  }

  // 2. Fallback to vehicle-tree.json
  try {
    const tree = await loadVehicleTree()
    const slug = brandSlug(brandName)
    const genSlug = brandSlug(generationName)
    const result = findVehicleImage(tree, slug, genSlug)
    if (result) {
      modelImageCache.set(cacheKey, result)
      return result
    }
  } catch {
    // tree load failed, ignore
  }

  modelImageCache.set(cacheKey, null)
  return null
}
