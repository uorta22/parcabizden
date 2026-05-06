import SchemaOrg from '@/components/SchemaOrg'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import Categories from '@/components/landing/Categories'
import Brands from '@/components/landing/Brands'
import WhyUs from '@/components/landing/WhyUs'
import Cta from '@/components/landing/Cta'

/**
 * Ana sayfa — 6 bölüm, ritm: dark → white → gray → white → gray → white.
 *
 *  1. Hero (dark)        — VehicleFinder + VIN/OEM tek odak
 *  2. HowItWorks (white) — 3 statik adım
 *  3. Categories (gray)  — 16 kategori discovery grid
 *  4. Brands (white)     — 18 marka logo grid
 *  5. WhyUs (gray)       — 3 değer önerisi
 *  6. Cta (white)        — son WhatsApp CTA
 *
 * Tasarım disiplini: hover/focus dışı animasyon yok, sahte içerik yok.
 */

export default function Home() {
  return (
    <main>
      <SchemaOrg showFaq />

      <Hero />
      <HowItWorks />
      <Categories />
      <Brands />
      <WhyUs />
      <Cta />
    </main>
  )
}
