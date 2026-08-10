import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AssistantWidget from '@/components/AssistantWidget'
import BackToTop from '@/components/BackToTop'

/**
 * Alıcı sitesinin kabuğu — parcabizden.com.tr
 *
 * Header, Footer ve yardım widget'ı burada; kök layout'ta DEĞİL. Aksi halde
 * satıcı paneli (/pazaryeri) ve talep yüzeyi (/talep) kendi gezinmelerinin
 * üstüne alıcı header'ını da alıyordu — panelde iki ayrı "Giriş Yap" linki
 * çıkıyordu, E2E bunu yakaladı.
 *
 * Route group olduğu için URL'lere hiçbir şey eklemez: (site)/parcalar
 * yine /parcalar adresinden servis edilir.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <AssistantWidget />
      <BackToTop />
    </>
  )
}
