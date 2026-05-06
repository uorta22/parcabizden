import SchemaOrg from '@/components/SchemaOrg'
import LandingHero from '@/components/LandingHero'
import HowItWorksSection from '@/components/HowItWorksSection'
import StatsSection from '@/components/StatsSection'
import FeaturesSection from '@/components/FeaturesSection'
import BrandMarquee from '@/components/BrandMarquee'
import TestimonialsSection from '@/components/TestimonialsSection'
import CtaBannerSection from '@/components/CtaBannerSection'
import DemoVideoSection from '@/components/DemoVideoSection'
import HeroSection from '@/components/HeroSection'

export default function Home() {
  return (
    <div className="min-h-screen">
      <SchemaOrg showFaq />

      {/* 1. Cinematic landing hero with VIN/OEM tabs */}
      <LandingHero />

      {/* 2. How it works — animated 3-step demo */}
      <HowItWorksSection />

      {/* 3. Stats counter */}
      <StatsSection />

      {/* 4. Interactive marketing demo (animated platform walkthrough) */}
      <DemoVideoSection />

      {/* 5. Full VIN/OEM search engine + parts list */}
      <section id="arama" className="py-16 md:py-24 bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold tracking-widest uppercase rounded-full border border-primary-200 mb-4">
              Parça Arama Motoru
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              Hemen <span className="text-primary-500">Aramaya Başlayın</span>
            </h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Şase veya OEM numaranızı girin — aracınıza uygun tüm parçaları listeleyelim.
            </p>
          </div>
          <HeroSection />
        </div>
      </section>

      {/* 6. Features bento grid */}
      <FeaturesSection />

      {/* 7. Brand marquee */}
      <BrandMarquee />

      {/* 8. Testimonials carousel */}
      <TestimonialsSection />

      {/* 9. Final CTA */}
      <CtaBannerSection />
    </div>
  )
}
