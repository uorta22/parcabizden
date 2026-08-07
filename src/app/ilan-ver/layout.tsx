import type { Metadata } from 'next'

// Kök layout'taki '%s | ParcaBizden' şablonu site adını zaten ekliyor.
export const metadata: Metadata = {
  title: 'İlan Ver',
  description: 'Çıkma, sıfır veya yenilenmiş parçanız için ücretsiz ilan verin. Fotoğraf ekleyin, net fiyat veya fiyat aralığı belirleyin, alıcılara ulaşın.',
  robots: { index: false, follow: true },
}

export default function IlanVerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
