import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/hesabim/',
          '/giris',
          '/kayit',
          '/admin/',
          '/sepet',
          '/dogrula',
          '/sifremi-unuttum',
          '/sifre-sifirla',
          '/opengraph-image',
          '/icon',
          '/apple-icon',
        ],
      },
    ],
    sitemap: 'https://parcabizden.com.tr/sitemap.xml',
  }
}
