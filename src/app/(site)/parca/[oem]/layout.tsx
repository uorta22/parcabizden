import type { Metadata } from 'next'
import type { ReactNode } from 'react'

interface Props {
  params: { oem: string }
  children: ReactNode
}

async function fetchPartInfo(oem: string) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.parcabizden.com.tr'
    const res = await fetch(
      `${apiBase}/?action=search_oem&q=${encodeURIComponent(oem)}`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.results?.[0] ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const oem = decodeURIComponent(params.oem)
  const part = await fetchPartInfo(oem)

  const partName = part?.name || `OEM ${oem} Yedek Parça`
  const brandName = part?.brand_name ? `${part.brand_name} ` : ''
  const category = part?.category ? ` — ${part.category.replace(/_/g, ' ')}` : ''

  const title = `${brandName}${partName}${category} | OEM: ${oem}`
  const description = part?.description
    ? part.description.slice(0, 155)
    : `${oem} OEM numaralı ${brandName}yedek parça veya çıkma parça. Stok bilgisi ve fiyat için hemen sorgulayın. Şase numarası ile araç uyumluluk kontrolü.`

  const canonicalUrl = `https://parcabizden.com.tr/parca/${encodeURIComponent(oem)}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      locale: 'tr_TR',
      siteName: 'ParcaBizden',
      ...(part?.thumbnail ? { images: [{ url: part.thumbnail, alt: partName }] } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default function PartsLayout({ children }: Props) {
  return <>{children}</>
}
