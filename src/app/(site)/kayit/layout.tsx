import type { Metadata } from 'next'

export const metadata: Metadata = {
  // Kök layout'taki '%s | ParcaBizden' şablonu site adını zaten ekliyor.
  title: 'Kayıt Ol',
  description: 'Ücretsiz ParcaBizden hesabı oluşturun; yedek parça talebi gönderin, tekliflerinizi takip edin.',
  robots: { index: false, follow: false },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
