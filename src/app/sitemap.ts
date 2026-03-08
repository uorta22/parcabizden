import { MetadataRoute } from 'next'
import { categories, parts } from '@/data/parts'

// Turkiye'de en populer markalar — sitemap'te marka sayfalari olarak indexlenir
const POPULAR_BRANDS = [
  'bmw', 'mercedes-benz', 'audi', 'volkswagen', 'ford', 'renault',
  'toyota', 'honda', 'hyundai', 'kia', 'opel', 'peugeot', 'citroen',
  'fiat', 'nissan', 'mazda', 'volvo', 'skoda', 'seat', 'dacia',
  'chevrolet', 'mitsubishi', 'suzuki', 'subaru', 'land-rover', 'jeep',
  'mini', 'porsche', 'alfa-romeo', 'cupra',
]

// Marka slug -> gosterim ismi
const BRAND_NAMES: Record<string, string> = {
  'bmw': 'BMW', 'mercedes-benz': 'Mercedes-Benz', 'audi': 'Audi',
  'volkswagen': 'Volkswagen', 'ford': 'Ford', 'renault': 'Renault',
  'toyota': 'Toyota', 'honda': 'Honda', 'hyundai': 'Hyundai',
  'kia': 'Kia', 'opel': 'Opel', 'peugeot': 'Peugeot', 'citroen': 'Citroen',
  'fiat': 'Fiat', 'nissan': 'Nissan', 'mazda': 'Mazda', 'volvo': 'Volvo',
  'skoda': 'Skoda', 'seat': 'Seat', 'dacia': 'Dacia',
  'chevrolet': 'Chevrolet', 'mitsubishi': 'Mitsubishi', 'suzuki': 'Suzuki',
  'subaru': 'Subaru', 'land-rover': 'Land Rover', 'jeep': 'Jeep',
  'mini': 'Mini', 'porsche': 'Porsche', 'alfa-romeo': 'Alfa Romeo',
  'cupra': 'Cupra',
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://parcabizden.com.tr'

  // Statik sayfalar
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/parcalar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sase-sorgula`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/hakkimizda`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/iletisim`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gizlilik`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/kullanim-sartlari`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Marka sayfalari — /parcalar?brand=bmw&marka=BMW seklinde
  const brandPages: MetadataRoute.Sitemap = POPULAR_BRANDS.map(slug => ({
    url: `${baseUrl}/parcalar?brand=${slug}&marka=${encodeURIComponent(BRAND_NAMES[slug] || slug)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Kategori sayfalari
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/parcalar/${category.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Parca detay sayfalari
  const partPages: MetadataRoute.Sitemap = parts.map((part) => ({
    url: `${baseUrl}/parcalar/${part.category}/${part.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...brandPages, ...categoryPages, ...partPages]
}
