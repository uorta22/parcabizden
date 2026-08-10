import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getListingDetail, listingDetailImageUrl } from '@/lib/listing-detail'

interface Props {
  params: { slug: string }
  children: ReactNode
}

const CONDITION_LABELS: Record<string, string> = {
  cikma: 'Çıkma',
  sifir: 'Sıfır',
  yenilenmis: 'Yenilenmiş',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getListingDetail(params.slug)

  if (!listing) {
    return { title: 'İlan Bulunamadı' }
  }

  const conditionLabel = CONDITION_LABELS[listing.condition_type] ?? listing.condition_type
  const vehiclePart = listing.vehicle_label ? ` — ${listing.vehicle_label}` : ''

  const title = `${listing.title}${vehiclePart}`
  const description = listing.description
    ? listing.description.slice(0, 155)
    : `${conditionLabel} ${listing.part_label}${vehiclePart}. ${listing.seller_name} güvencesiyle, ${listing.city_name ?? 'Türkiye geneli'} kargo. Fiyat ve stok için hemen inceleyin.`

  const canonicalUrl = `https://parcabizden.com.tr/ilan/${listing.slug}`
  const coverImage = listing.images[0] ? listingDetailImageUrl(listing.images[0]) : null

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
      ...(coverImage ? { images: [{ url: coverImage, alt: listing.title }] } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default function ListingLayout({ children }: Props) {
  return <>{children}</>
}
