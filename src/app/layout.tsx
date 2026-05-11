import type { Metadata } from 'next'
import { Inter, Archivo_Black, Space_Grotesk } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SchemaOrg from '@/components/SchemaOrg'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { siteConfig } from '@/lib/config'

// Lazy load: başlangıçta görünmeyen veya etkileşim sonrası açılan bileşenler
const AssistantWidget = dynamic(() => import('@/components/AssistantWidget'), { ssr: false })
const BackToTop = dynamic(() => import('@/components/BackToTop'), { ssr: false })
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false })

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })
const archivoBlack = Archivo_Black({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-archivo-black' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-space-grotesk' })

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} - Yedek Parça & Çıkma Parça Talep Platformu`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: 'yedek parça, çıkma parça, oto yedek parça, araç parçası, motor parçası, şanzıman, süspansiyon, fren sistemi, şase numarası ile parça arama, çıkma parça istanbul',
  authors: [{ name: siteConfig.name }],
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: `${siteConfig.name} - Yedek Parça & Çıkma Parça Talep Platformu`,
    description: siteConfig.description,
    type: 'website',
    locale: 'tr_TR',
    siteName: siteConfig.name,
    url: siteConfig.url,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - Yedek Parça & Çıkma Parça`,
    description: siteConfig.description,
  },
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  verification: {
    // Google Search Console dogrulama kodu — GSC'den alindiktan sonra buraya eklenmeli
    // google: 'YOUR_GOOGLE_VERIFICATION_CODE',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#eab308" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${inter.variable} ${archivoBlack.variable} ${spaceGrotesk.variable} ${inter.className} bg-white text-gray-900`}>
        <SchemaOrg />
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <Header />
              <main className="min-h-screen">
                {children}
              </main>
              <Footer />
              <AssistantWidget />
              <BackToTop />
              <CookieConsent />
              <SpeedInsights />
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
