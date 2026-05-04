import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Yedek Parça Ara (V2 — TecDoc) | ParcaBizden',
  description: 'TecDoc kataloğu üzerinde marka → model → varyant zinciri ile birebir uyumlu yedek parça arama.',
}

export default function ParcalarV2Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
