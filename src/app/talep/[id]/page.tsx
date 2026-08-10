import type { Metadata } from 'next'
import RequestDetailClient from './RequestDetailClient'

export const metadata: Metadata = {
  title: 'Talep Detayı',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: { id: string }
  searchParams: { t?: string }
}

export default function RequestDetailPage({ params, searchParams }: PageProps) {
  return <RequestDetailClient id={params.id} token={searchParams.t ?? ''} />
}
