import SchemaOrg from '@/components/SchemaOrg'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import Categories from '@/components/landing/Categories'
import Brands from '@/components/landing/Brands'
import WhyUs from '@/components/landing/WhyUs'
import Cta from '@/components/landing/Cta'
import HeroSection from '@/components/HeroSection'

/**
 * Ana sayfa — 6 sade bölüm.
 *
 * Tasarım hiyerarşisi:
 *  1. Hero (dark)        — tek odak: arama
 *  2. HowItWorks (white) — açıklama
 *  3. Categories (gray)  — discovery
 *  4. (Search engine)    — kullanıcı arama yapmaya hazır
 *  5. Brands (white)     — sosyal kanıt
 *  6. WhyUs (gray)       — değer önerisi
 *  7. Cta (white)        — son ask
 *
 * Karanlık/aydınlık ritmi: dark → light → gray → light → light → gray → light
 * Animasyon disiplini: yalnızca hover ve focus state'leri. Carousel/marquee yok.
 */

export default function Home() {
  return (
    <main>
      <SchemaOrg showFaq />

      <Hero />
      <HowItWorks />
      <Categories />

      {/* Mevcut arama motoru — kullanıcı doğrudan parça araması yapabilsin */}
      <section id="arama" className="border-y border-gray-200 bg-gray-50 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <header className="mb-10 max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-600">
              Parça Arama Motoru
            </p>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
              Hemen aramaya başlayın
            </h2>
          </header>
          <HeroSection />
        </div>
      </section>

      <Brands />
      <WhyUs />
      <Cta />
    </main>
  )
}
