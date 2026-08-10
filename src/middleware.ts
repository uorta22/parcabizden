import { NextResponse, type NextRequest } from 'next/server'

/**
 * Üç yüzeyi tek kod tabanından servis eder.
 *
 *   parcabizden.com.tr            → alıcı sitesi        (kök yollar)
 *   pazaryeri.parcabizden.com.tr  → satıcı paneli       → /pazaryeri/*
 *   talep.parcabizden.com.tr      → talep toplama       → /talep/*
 *
 * GÜVENLİK NOTU — bu dosya bir güvenlik sınırı DEĞİLDİR.
 * Veri API'si ayrı bir hostta (api.parcabizden.com.tr) ve middleware o
 * isteği hiç görmez; biri doğrudan curl atarsa buradan geçmez. Gerçek
 * yetkilendirme PHP tarafındadır (requireAdmin, listing_require_seller,
 * offer_require_dispatch). Buradaki kontrol yalnızca yüzeylerin
 * birbirine karışmasını engeller.
 */

const SURFACE_BY_SUBDOMAIN: Record<string, string> = {
  pazaryeri: '/pazaryeri',
  talep: '/talep',
}

/** Yüzey öneklerinin tamamı — ana alan adından doğrudan erişilemez. */
const SURFACE_PREFIXES = Object.values(SURFACE_BY_SUBDOMAIN)

/** Host'tan alt alan adını çıkarır. Port ve www ayıklanır. */
function subdomainOf(host: string): string | null {
  const clean = host.split(':')[0].toLowerCase()

  // Yerel geliştirme: pazaryeri.localhost:3000 → "pazaryeri"
  // Ek atıldıktan sonra geriye TEK parça kalır; buraya genel parça sayısı
  // kontrolü uygulanmaz (uygulanırsa alt alan adı hiç görülmez).
  if (clean.endsWith('.localhost')) {
    const sub = clean.slice(0, -'.localhost'.length)
    return sub && sub !== 'www' ? sub : null
  }

  const parts = clean.split('.')
  if (parts.length < 2) return null
  const first = parts[0]
  return first === 'www' ? null : first
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const { pathname } = request.nextUrl
  const sub = subdomainOf(host)
  const surface = sub ? SURFACE_BY_SUBDOMAIN[sub] : undefined

  if (surface) {
    // Alt alan adı kendi ağacına yazılır: pazaryeri.../ilan-ver → /pazaryeri/ilan-ver
    // Zaten önekliyse tekrar eklemeyiz (iç yönlendirmelerde döngü olmasın).
    if (pathname === surface || pathname.startsWith(`${surface}/`)) {
      return NextResponse.next()
    }
    const url = request.nextUrl.clone()
    url.pathname = `${surface}${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)
  }

  // Ana alan adından yüzey yollarına doğrudan erişim kapalı: satıcı paneli
  // parcabizden.com.tr/pazaryeri adresinden açılmasın.
  if (SURFACE_PREFIXES.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.rewrite(new URL('/404', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Statik dosyalar, Next iç yolları ve metadata dosyaları dışarıda.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|brands|data|images|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml|webmanifest)$).*)'],
}
