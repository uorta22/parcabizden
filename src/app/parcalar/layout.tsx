import type { Metadata } from 'next'

// useSearchParams ile birlikte prerender'ı bypass et
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tüm Parçalar - Yedek Parça & Çıkma Parça | ParcaBizden',
  description: 'Motor parçaları, şanzıman, süspansiyon, fren sistemi, kaporta ve daha fazlası. Tüm marka ve modellere uygun yedek parça ve çıkma parça.',
  keywords: 'yedek parça, çıkma parça, motor parçası, şanzıman, süspansiyon, fren, kaporta, far, elektrik aksamı',
}

export default function ParcalarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
