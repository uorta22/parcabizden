import SchemaOrg from '@/components/SchemaOrg'
import Hero from '@/components/landing/Hero'
import PromoSlider from '@/components/landing/PromoSlider'
import HowItWorks from '@/components/landing/HowItWorks'
import LatestListings from '@/components/landing/LatestListings'
import Categories from '@/components/landing/Categories'
import Brands from '@/components/landing/Brands'
import Cta from '@/components/landing/Cta'

/**
 * Anasayfa — sade beyaz e-ticaret tonu.
 *
 *  1. Hero           — talep birincil, araç seçimi ikincil filtre
 *  2. LatestListings — pazaryerinde mal olduğunun kanıtı; ilan yoksa talebe yönlendirir
 *  3. PromoSlider    — tanıtım banner (auto-rotate)
 *  4. Categories     — 5 ana grup; linkler ilan aramasına gider
 *  5. HowItWorks     — talep → teklif → karşılaştırma
 *  6. Brands         — marka logo grid
 *  7. Cta            — destek bantları
 *
 * WhyUs kaldırıldı — sade akış için gerekmiyor.
 */

export default function Home() {
  return (
    <main>
      <SchemaOrg showFaq />

      <Hero />
      <LatestListings />
      <PromoSlider />
      <Categories />
      <HowItWorks />
      <Brands />
      <Cta />
    </main>
  )
}
