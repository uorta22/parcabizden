# ParcaBizden — Proje Dokümantasyonu

## Proje Genel Bakış
Türkçe oto yedek parça arama ve talep platformu.
- **Frontend**: Next.js 14 (App Router) — Vercel'de yayınlanıyor
- **Backend**: PHP (natro-index.php) — Natro shared hosting, `api.parcabizden.com.tr` üzerinden
- **Branch**: `claude/auto-parts-request-site-OpsbX` (Vercel bu branch'ten deploy ediyor)

## Mimari

### API Routing
- `natro-index.php` → CI/CD ile `deploy/index.php` olarak kopyalanır → `api.parcabizden.com.tr/` servis eder
- `api/index.php` CI/CD'de atlanır (natro-index.php kullanılır)
- `php-backend/*.php` modülleri `deploy/` altına kopyalanır (migrate-* hariç)
- `api/endpoints/*.php` → `deploy/endpoints/` altına kopyalanır

### Frontend API Çağrıları
- Production: `NEXT_PUBLIC_API_URL=https://api.parcabizden.com.tr`
- Development: `NEXT_PUBLIC_API_URL=/api` → `src/app/api/route.ts` catch-all proxy'si aracılığıyla Natro'ya yönlendirilir
- `actionPost({action: 'xxx'})` → POST `${API_BASE}/?action=xxx` (CSRF header gerekli: `X-Requested-With: XMLHttpRequest`)
- `actionFetch({action: 'xxx'})` → GET `${API_BASE}/?action=xxx`

### Özel Proxy Route'lar (Next.js)
- `src/app/api/route.ts` — Tüm `?action=...` isteklerini Natro'ya yönlendiren catch-all proxy (dev için)
- `src/app/api/generations/route.ts` — ISR önbellekli nesil proxy (1 saat TTL)
- `src/app/api/brands/route.ts` — Marka listesi proxy

## Önemli Dosyalar
- `natro-index.php` — PHP backend ana router (tüm action'lar burada switch)
- `php-backend/reviews.php` — Bağımsız reviews endpoint (`api.parcabizden.com.tr/reviews.php`)
- `api/.htaccess` — Apache config (CI/CD'ye dahil edilmez, referans amaçlı)
- `src/components/GarageCard.tsx` — Araç kartı bileşeni
- `src/app/garaj/[id]/page.tsx` — Araç detay + bakım sayfası (hesabim/garaj/[id] re-export'u)
- `src/app/hesabim/garaj/[id]/page.tsx` — Hesabım layout içinde araç detayı
- `src/app/hesabim/garaj/page.tsx` — Garaj liste sayfası
- `src/lib/api.ts` — Tüm frontend API çağrıları
- `src/app/layout.tsx` — Root layout (SchemaOrg body'de)
- `.github/workflows/deploy-php.yml` — CI/CD pipeline (FTPS → Natro)
- `.env.development` / `.env.production` — Ortam değişkenleri

## Düzeltilen Sorunlar

### CORS
- `natro-index.php`: Sabit CORS origin → dinamik (parcabizden.com.tr, www., *.vercel.app)
- `php-backend/reviews.php`: Aynı dinamik CORS fix
- `api/.htaccess`: Duplicate statik `Access-Control-Allow-Origin` Apache header kaldırıldı

### UI/UX
- `GarageCard.tsx` "Bakım" butonu: dead `<span>` → `<Link href={detailHref}>` + stopPropagation
- `garaj/[id]/page.tsx`: Çift layout sorunu düzeltildi (min-h-screen wrapper + container kaldırıldı, hesabim layout ile uyumlu hale getirildi)
- Garaj detay breadcrumb: "Ana Sayfa > Garajım > [Araç]" formatına getirildi
- Uyumlu Ürünler butonu kaldırıldı (kırık link, vehicle context kaybettiriyordu)
- Kullanılmayan `ShoppingBag` import kaldırıldı

### Hydration
- `SchemaOrg` bileşeni `<head>`'den `<body>`'ye taşındı (Next.js App Router uyumluluğu)

### Dev Ortamı
- `src/app/api/route.ts` eklendi: development'ta `actionFetch`/`actionPost` çağrılarını Natro API'ye proxy'liyor

## Bilinen Sınırlamalar
- E-posta doğrulama: `email_verified=1` hardcoded (gerçek e-posta gönderilmiyor, kasıtlı)
- SMTP: Tanımlı ama inaktif (`SMTP_PASS` boş)
- GarageCard: İç içe `<Link>` (geçersiz HTML ama çalışıyor, düşük öncelikli refactor)
- Giriş sonrası `/garaj` → `/hesabim/garaj` yönlendirmesi (iki adım ama işlevsel)

## CI/CD
- `.github/workflows/deploy-php.yml`: push → `main` veya `claude/auto-parts-request-site-OpsbX` branch'inde `natro-index.php`, `php-backend/*.php`, `api/*.php` (index ve auth hariç) değiştiğinde tetiklenir
- FTPS ile Natro'ya deploy edilir

## Geliştirme Ortamı
- `npm run dev` — Next.js dev server (port 5000)
- Dev ortamında API çağrıları `/api` proxy üzerinden Natro production'ına gider
