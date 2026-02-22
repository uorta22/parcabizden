import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import SchemaOrg from '@/components/SchemaOrg'
import { AuthProvider } from '@/contexts/AuthContext'
import { siteConfig } from '@/lib/config'

const inter = Inter({ subsets: ['latin', 'latin-ext'] })

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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-verification-code',
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
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <SchemaOrg />
      </head>
      <body className={`${inter.className} bg-white text-gray-900`}>
        <AuthProvider>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  )
}
