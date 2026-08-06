import type { Metadata } from 'next'

export const metadata: Metadata = {
  // Kök layout'taki '%s | ParcaBizden' şablonu site adını zaten ekliyor.
  title: 'Giriş Yap',
  description: 'ParcaBizden hesabınıza giriş yapın; taleplerinizi, siparişlerinizi ve garajınızdaki araçları tek yerden yönetin.',
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
