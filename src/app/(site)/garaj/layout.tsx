import type { Metadata } from 'next'

export const metadata: Metadata = {
  // Kök layout'taki '%s | ParcaBizden' şablonu site adını zaten ekliyor.
  title: 'Garajım',
  description: 'Kayıtlı araçlarınızı görüntüleyin; aracınıza uyumlu yedek parçalara hızlıca ulaşın.',
}

export default function GarageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
