import { siteConfig } from '@/lib/config'

interface SchemaOrgProps {
  type?: 'website' | 'organization' | 'localBusiness'
}

export default function SchemaOrg({ type = 'localBusiness' }: SchemaOrgProps) {
  const schemas = []

  // Organization Schema
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/favicon.ico`,
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
      image: `${siteConfig.url}/favicon.ico`,
      sameAs: [
        siteConfig.social.instagram,
        siteConfig.social.facebook,
      ].filter(Boolean),
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
      target: `${siteConfig.url}/sase-sorgula?vin={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
  schemas.push(websiteSchema)

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
