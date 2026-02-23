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
