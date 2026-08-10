import type { Metadata } from 'next'

// useSearchParams ile birlikte prerender'ı bypass et
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  // Kök layout'taki '%s | ParcaBizden' şablonu site adını zaten ekliyor.
  title: 'İlanlar - Satıcı İlanlarında Ara',
  description: 'ParcaBizden pazaryerindeki satıcı ilanlarında marka, model, şehir ve fiyata göre arama yapın. Katalogdan doğrulanmış uyum bilgisiyle güvenle alışveriş edin.',
  keywords: 'yedek parça ilanı, çıkma parça ilanı, ikinci el oto parça, parça ara',
}

export default function IlanlarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
