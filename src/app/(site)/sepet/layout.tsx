import type { Metadata } from 'next'

export const metadata: Metadata = {
  // Kök layout'taki '%s | ParcaBizden' şablonu site adını zaten ekliyor.
  title: 'Sepetim',
  description: 'Sepetinizdeki yedek parçaları gözden geçirin, adet güncelleyin ve siparişinizi tamamlayın.',
  robots: { index: false, follow: false },
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
