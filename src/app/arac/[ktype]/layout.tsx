import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Aracım | ParcaBizden',
  description: 'Aracınıza ait teknik bilgi, uyumlu parçalar, bakım takibi.',
}

export default function VehicleHubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
