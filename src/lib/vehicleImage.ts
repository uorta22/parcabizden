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

  // Exact generation match
  for (const img of brandMatches) {
    if (normalize(img.generation) === searchNorm) return img.image
  }

  // Cross-match: search parts against generation name (normalized, full string)
  // sp'nin generation'ın normalize halinde olup olmadığını kontrol et
  // Ama sp'den sonra gelen karakter rakam veya romen rakamı parçası olmamalı (focusii ≠ focusiii)
  const genNormFull = brandMatches.map(img => ({ img, norm: normalize(img.generation) }))
  for (const sp of searchParts) {
    if (sp.length < 5) continue
    for (const { img, norm } of genNormFull) {
      const idx = norm.indexOf(sp)
      if (idx === -1) continue
      // sp'den sonra gelen karakter: aynı "kelime" devam etmemeli
      // Romen rakamları (i,v,x) ve rakamlar kontrol edilmeli
      const after = norm[idx + sp.length]
      if (after && /[ivx0-9]/.test(after) && /[ivx0-9]/.test(sp[sp.length - 1])) continue
      return img.image
    }
  }

  // Partial model name match — stricter: must startsWith
  for (const img of brandMatches) {
    const modelNorm = normalize(img.model)
    if (modelNorm.startsWith(searchNorm) || searchNorm.startsWith(modelNorm)) return img.image
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

export async function findAutodataGenerationImage(
  brandName: string,
  generationName: string
): Promise<string | null> {
  // 1. Try autodata per-brand JSON
  const autodataResult = await findAutodataImage(brandName, generationName)
  if (autodataResult) return autodataResult

  // 2. Fallback to vehicle-tree.json
  try {
    const tree = await loadVehicleTree()
    const slug = brandSlug(brandName)
    const genSlug = brandSlug(generationName)
    const result = findVehicleImage(tree, slug, genSlug)
    if (result) return result
  } catch {
    // tree load failed, ignore
  }

  return null
}
