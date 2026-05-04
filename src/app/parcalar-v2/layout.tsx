import type { Metadata } from 'next'

// Bu route segment'i her istekte server-side render edilir.
// useSearchParams kullanan istemci bileşeni Suspense'le sarılmış olsa da
// prerender sırasında URL bilinmediği için statik export yerine dynamic.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Yedek Parça Ara (V2 — TecDoc) | ParcaBizden',
  description: 'TecDoc kataloğu üzerinde marka → model → varyant zinciri ile birebir uyumlu yedek parça arama.',
}

export default function ParcalarV2Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
