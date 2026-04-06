import { siteConfig } from '@/lib/config'

interface SchemaOrgProps {
  type?: 'website' | 'organization' | 'localBusiness'
  breadcrumbs?: { name: string; url: string }[]
  showFaq?: boolean
}

export default function SchemaOrg({ type = 'localBusiness', breadcrumbs, showFaq = false }: SchemaOrgProps) {
  const schemas = []

  // Organization Schema
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/opengraph-image`,
    description: siteConfig.description,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: siteConfig.phone.raw,
      contactType: 'customer service',
      availableLanguage: 'Turkish',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: siteConfig.address.city,
      addressCountry: 'TR',
    },
  }
  schemas.push(orgSchema)

  // Local Business Schema
  if (type === 'localBusiness') {
    const localSchema = {
      '@context': 'https://schema.org',
      '@type': 'AutoPartsStore',
      name: siteConfig.name,
      url: siteConfig.url,
      telephone: siteConfig.phone.raw,
      email: siteConfig.email,
      description: siteConfig.description,
      address: {
        '@type': 'PostalAddress',
        addressLocality: siteConfig.address.city,
        addressCountry: 'TR',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '09:00',
          closes: '19:00',
        },
      ],
      priceRange: '$$',
      image: `${siteConfig.url}/opengraph-image`,
      ...(([siteConfig.social.instagram, siteConfig.social.facebook].filter(Boolean).length > 0) && {
        sameAs: [siteConfig.social.instagram, siteConfig.social.facebook].filter(Boolean),
      }),
    }
    schemas.push(localSchema)
  }

  // Website Schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: 'tr-TR',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/parcalar?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
  schemas.push(websiteSchema)

  // BreadcrumbList Schema
  if (breadcrumbs && breadcrumbs.length > 0) {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    }
    schemas.push(breadcrumbSchema)
  }

  // FAQPage Schema — sadece ana sayfada göster
  if (showFaq) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Şase numarası ile parça arayabilir miyim?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Evet, şase numaranızı girerek aracınıza uygun yedek ve çıkma parçaları sorgulayabilirsiniz. Şase sorgulama sayfamızdan 17 haneli VIN numaranızı girerek başlayın.',
        },
      },
      {
        '@type': 'Question',
        name: 'Hangi marka araçlara yedek parça bulabiliyorsunuz?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'BMW, Mercedes, Audi, Volkswagen, Ford, Renault, Toyota, Honda, Hyundai ve daha birçok marka dahil 50\'den fazla marka için yedek ve çıkma parça temin ediyoruz.',
        },
      },
      {
        '@type': 'Question',
        name: 'Parça fiyatlarını nasıl öğrenebilirim?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Parça fiyatları aracın marka, model ve yılına göre değişiklik göstermektedir. Güncel fiyat ve stok bilgisi için WhatsApp üzerinden 0544 981 91 44 numarasına ulaşabilirsiniz.',
        },
      },
      {
        '@type': 'Question',
        name: 'Çıkma parça ile yedek parça arasındaki fark nedir?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yedek parça fabrikadan üretilen sıfır parçadır. Çıkma parça ise başka bir araçtan sökülen, kullanılmış ama çalışır durumda olan parçadır. Çıkma parçalar genellikle daha uygun fiyatlıdır.',
        },
      },
    ],
  }
  schemas.push(faqSchema)
  } // end showFaq

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
