import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ParcaBizden - Yedek Parca & Cikma Parca Talep Platformu',
  description: 'Arac yedek parcasi ve cikma parca ihtiyaclariniz icin dogru adres. Sase numarasi ile arama yapin, tum markalara uygun parcalari bulun. Hizli WhatsApp destek.',
  keywords: 'yedek parca, cikma parca, oto yedek parca, arac parcasi, motor parcasi, sanziman, suspansiyon, fren sistemi, sase numarasi ile parca arama',
  authors: [{ name: 'ParcaBizden' }],
  openGraph: {
    title: 'ParcaBizden - Yedek Parca & Cikma Parca Talep Platformu',
    description: 'Arac yedek parcasi ve cikma parca ihtiyaclariniz icin dogru adres.',
    type: 'website',
    locale: 'tr_TR',
    siteName: 'ParcaBizden',
  },
  robots: {
    index: true,
    follow: true,
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
        <meta name="theme-color" content="#1a2652" />
      </head>
      <body className={`${inter.className} bg-dark-900 text-white`}>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  )
}
