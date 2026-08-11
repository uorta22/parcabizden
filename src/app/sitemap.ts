import { MetadataRoute } from 'next'
import { PART_CATEGORY_GROUPS } from '@/lib/part-categories'

const baseUrl = 'https://parcabizden.com.tr'

/**
 * Sitemap yalnızca gerçekten var olan sayfaları listeliyor.
 *
 * Eskiden buraya legacy katalogdan (parts tablosu) çekilen ~1000 OEM için
 * /parca/{oem} ve elle yazılmış 17 adet /parcalar/{kategori}/{parca} URL'i
 * giriyordu. O rotalar kaldırıldı; Google'a olmayan sayfa bildirmemek için
 * onlar da gitti. Yerlerini kategori bazlı ilan aramaları aldı.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                        changeFrequency: 'daily',   priority: 1,   lastModified: now },
    { url: `${baseUrl}/ilanlar`,           changeFrequency: 'daily',   priority: 0.9, lastModified: now },
    { url: `${baseUrl}/iletisim`,          changeFrequency: 'monthly', priority: 0.8, lastModified: new Date('2025-01-01') },
    { url: `${baseUrl}/hakkimizda`,        changeFrequency: 'monthly', priority: 0.7, lastModified: new Date('2025-01-01') },
    { url: `${baseUrl}/gizlilik`,          changeFrequency: 'yearly',  priority: 0.3, lastModified: new Date('2025-01-01') },
    { url: `${baseUrl}/kullanim-sartlari`, changeFrequency: 'yearly',  priority: 0.3, lastModified: new Date('2025-01-01') },
  ]

  const categoryPages: MetadataRoute.Sitemap = PART_CATEGORY_GROUPS.flatMap(g =>
    g.items.map(c => ({
      url: `${baseUrl}/ilanlar?category=${c.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      lastModified: now,
    }))
  )

  return [...staticPages, ...categoryPages]
}
