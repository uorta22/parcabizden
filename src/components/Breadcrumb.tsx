// Breadcrumb bileşeni — SEO dostu gezinme yolu + JSON-LD şeması
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { siteConfig } from '@/lib/config'

// Her breadcrumb öğesinin tipi
export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

// Göreceli URL'leri mutlak URL'ye dönüştür (JSON-LD için)
function toAbsoluteUrl(href: string): string {
  // Zaten mutlak URL ise dokunma
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href
  }
  // Göreceli URL ise site URL'sini başına ekle
  const base = siteConfig.url.replace(/\/$/, '')
  const path = href.startsWith('/') ? href : `/${href}`
  return `${base}${path}`
}

// JSON-LD BreadcrumbList şeması oluştur
function buildJsonLd(items: BreadcrumbItem[]): string {
  const listItems = items.map((item, index) => {
    // Temel ListItem yapısı
    const listItem: Record<string, unknown> = {
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
    }

    // href yoksa item alanını ekleme (son eleman genellikle href içermez)
    if (item.href) {
      listItem.item = toAbsoluteUrl(item.href)
    }

    return listItem
  })

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: listItems,
  }

  return JSON.stringify(schema)
}

// Server Component — 'use client' gerekmez
export default function Breadcrumb({ items }: BreadcrumbProps) {
  // Boş liste gelirse hiçbir şey render etme
  if (!items || items.length === 0) return null

  const jsonLd = buildJsonLd(items)

  return (
    <>
      {/* JSON-LD yapısal veri — SEO için */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      {/* Görsel breadcrumb navigasyonu */}
      <nav
        aria-label="Sayfa yolu"
        className="flex items-center gap-2 text-sm flex-wrap"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <span key={index} className="flex items-center gap-2">
              {/* Ayraç — ilk elemandan önce gösterme */}
              {index > 0 && (
                <ChevronRight
                  size={14}
                  className="text-gray-400 flex-shrink-0"
                  aria-hidden="true"
                />
              )}

              {/* Son eleman: link değil, kalın metin */}
              {isLast ? (
                <span
                  className="font-medium text-gray-900"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                // Diğer elemanlar: tıklanabilir link
                item.href ? (
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  // href yoksa düz metin olarak göster
                  <span className="text-gray-500">{item.label}</span>
                )
              )}
            </span>
          )
        })}
      </nav>
    </>
  )
}
