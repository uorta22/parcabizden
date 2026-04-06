import { MetadataRoute } from 'next'

const baseUrl = 'https://parcabizden.com.tr'
const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.parcabizden.com.tr'

async function fetchOemList(): Promise<string[]> {
  try {
    const res = await fetch(
      `${apiBase}/?action=product_list`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'per_page=1000&page=1',
        next: { revalidate: 86400 },
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    const products: { oem_number?: string }[] = data?.products ?? []
    return products.filter(p => p.oem_number).map(p => p.oem_number!)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                          lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: `${baseUrl}/parcalar`,            lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/iletisim`,            lastModified: new Date('2025-01-01'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/hakkimizda`,          lastModified: new Date('2025-01-01'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/gizlilik`,            lastModified: new Date('2025-01-01'), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/kullanim-sartlari`,   lastModified: new Date('2025-01-01'), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  const oemList = await fetchOemList()
  const productPages: MetadataRoute.Sitemap = oemList.map(oem => ({
    url: `${baseUrl}/parca/${encodeURIComponent(oem)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticPages, ...productPages]
}
