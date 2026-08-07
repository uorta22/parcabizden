import type { Metadata } from 'next'

export const metadata: Metadata = {
  // Kök layout'taki '%s | ParcaBizden' şablonu site adını zaten ekliyor.
  title: 'Mağaza Aç',
  description: 'ParcaBizden’de satıcı olun. Vergi levhanızı yükleyip başvurunuzu gönderin; onay sonrası çıkma ve yedek parça ilanlarınızı yayınlamaya başlayın.',
}

export default function MagazaAcLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
