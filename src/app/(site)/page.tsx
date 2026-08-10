import SchemaOrg from '@/components/SchemaOrg'
import Hero from '@/components/landing/Hero'
import PromoSlider from '@/components/landing/PromoSlider'
import HowItWorks from '@/components/landing/HowItWorks'
import Categories from '@/components/landing/Categories'
import Brands from '@/components/landing/Brands'
import Cta from '@/components/landing/Cta'

/**
 * Anasayfa — sade beyaz e-ticaret tonu.
 *
 *  1. Hero          — VehicleFinder + VIN/OEM
 *  2. PromoSlider   — kampanya banner (auto-rotate)
 *  3. Categories    — 5 ana grup, görselli
 *  4. HowItWorks    — 3 adım
 *  5. Brands        — 18 marka logo grid
 *  6. Cta           — banner tarz destek bantları
 *
 * WhyUs kaldırıldı — sade akış için gerekmiyor.
 */

export default function Home() {
  return (
    <main>
      <SchemaOrg showFaq />

      <Hero />
      <PromoSlider />
      <Categories />
      <HowItWorks />
      <Brands />
      <Cta />
    </main>
  )
}
