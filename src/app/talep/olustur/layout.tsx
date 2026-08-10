import type { Metadata } from 'next'

// Kök layout'taki '%s | ParcaBizden' şablonu site adını zaten ekliyor.
export const metadata: Metadata = {
  title: 'Talep Aç',
  description: 'Aradığınız parçayı ücretsiz ve üyeliksiz talep edin, satıcılar size teklif göndersin. Sadece telefon numaranız yeterli.',
  robots: { index: false, follow: true },
}

export default function TalepAcLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
