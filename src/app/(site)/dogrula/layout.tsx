import type { Metadata } from 'next'

export const metadata: Metadata = {
  // Kök layout'taki '%s | ParcaBizden' şablonu site adını zaten ekliyor.
  title: 'E-posta Doğrulama',
  description: 'Hesabınızı etkinleştirmek için e-posta adresinizi doğrulayın.',
  robots: { index: false, follow: false },
}

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
