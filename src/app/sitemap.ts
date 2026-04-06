import { MetadataRoute } from 'next'

const baseUrl = 'https://parcabizden.com.tr'

async function fetchOemList(): Promise<string[]> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.parcabizden.com.tr'
    const res = await fetch(`${apiBase}/?action=product_list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'per_page=1000&page=1',
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    const products: Array<{ oem_number?: string }> = data?.products ?? []
    return products.filter((p) => p.oem_number).map((p) => p.oem_number as string)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                        changeFrequency: 'daily',   priority: 1,   lastModified: new Date() },
    { url: `${baseUrl}/parcalar`,          changeFrequency: 'daily',   priority: 0.9, lastModified: new Date() },
    { url: `${baseUrl}/iletisim`,          changeFrequency: 'monthly', priority: 0.8, lastModified: new Date('2025-01-01') },
    { url: `${baseUrl}/hakkimizda`,        changeFrequency: 'monthly', priority: 0.7, lastModified: new Date('2025-01-01') },
    { url: `${baseUrl}/gizlilik`,          changeFrequency: 'yearly',  priority: 0.3, lastModified: new Date('2025-01-01') },
    { url: `${baseUrl}/kullanim-sartlari`, changeFrequency: 'yearly',  priority: 0.3, lastModified: new Date('2025-01-01') },
  ]

  const oemList = await fetchOemList()
  const productPages: MetadataRoute.Sitemap = oemList.map((oem) => ({
    url: `${baseUrl}/parca/${encodeURIComponent(oem)}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    lastModified: new Date(),
  }))

  return [...staticPages, ...productPages]
}
