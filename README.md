# ParcaBizden — Yedek & Çıkma Parça Talep Platformu

Türkiye pazarına yönelik oto yedek parça arama ve talep platformu. VIN (şase numarası) ve OEM parça numarası ile araç bazlı parça araması yapar. Next.js 14 frontend + PHP backend mimarisi üzerine kuruludur.

---

## İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Mimari](#mimari)
3. [Teknoloji Yığını](#teknoloji-yığını)
4. [Dizin Yapısı](#dizin-yapısı)
5. [Veritabanı](#veritabanı)
6. [Backend (PHP API)](#backend-php-api)
7. [Frontend (Next.js)](#frontend-nextjs)
8. [Kimlik Doğrulama](#kimlik-doğrulama)
9. [Sepet & Sipariş Sistemi](#sepet--sipariş-sistemi)
10. [Araç Kataloğu & Parça Arama](#araç-kataloğu--parça-arama)
11. [Admin Paneli](#admin-paneli)
12. [SEO & Performans](#seo--performans)
13. [Güvenlik](#güvenlik)
14. [Deploy & Ortam Değişkenleri](#deploy--ortam-değişkenleri)
15. [Geliştirme Ortamı Kurulumu](#geliştirme-ortamı-kurulumu)

---

## Proje Genel Bakış

ParcaBizden; kullanıcıların şase numarası (VIN) ya da OEM parça numarası girerek araçlarına uygun yedek ve çıkma parça aramasını, talep oluşturmasını ve WhatsApp üzerinden satıcıyla iletişim kurmasını sağlayan bir e-ticaret + katalog platformudur.

**Temel özellikler:**

- VIN ile araç tanıma (NHTSA API + araç ağacı eşleştirme)
- OEM numarası ile doğrudan parça arama
- 100+ marka, binlerce araç modeli ve nesli kataloğu
- 17 parça kategorisi, hiyerarşik parça ağacı
- Akıllı Türkçe arama (keyword → İngilizce eşleme motoru)
- Kullanıcı garajı (araç ekleme, km takibi, bakım planı)
- Favori ürünler, adres yönetimi, sipariş geçmişi
- Admin paneli (ürün CRUD, sipariş yönetimi)
- WhatsApp entegrasyonu (sepet paylaşımı, parça talebi)
- Canlı chat widget (ticket tabanlı)
- Tam SEO altyapısı (Schema.org, sitemap, robots.txt)
- Cookie consent, KVKK uyumu

---

## Mimari

```
┌─────────────────────────────────────────────────────┐
│                    Kullanıcı                        │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
           ┌───────────▼───────────┐
           │   Next.js 14 App      │  ← Vercel (fra1)
           │   (App Router + SSR)  │
           │                       │
           │  /app/api/*           │  ← Next.js Route Handlers
           │  (proxy + rate limit) │     (chat, brands, generations)
           └───────────┬───────────┘
                       │ HTTPS (REST)
           ┌───────────▼───────────┐
           │   PHP 8+ API          │  ← Natro Hosting
           │   api.parcabizden.com │
           │                       │
           │  MySQL (users, shop)  │
           │  SQLite (katalog DB)  │
           └───────────────────────┘
                       │
           ┌───────────▼───────────┐
           │   NHTSA API           │  ← VIN decode (harici)
           │   (VIN decode)        │
           └───────────────────────┘
```

**İki ayrı veritabanı vardır:**

| Veritabanı | Tür | Kullanım |
|---|---|---|
| `parcabizden` (MySQL) | InnoDB | Kullanıcılar, siparişler, ürünler, favoriler, adresler, chat, audit log |
| `parcabizden_v3.db` (SQLite) | Read-only | Araç kataloğu — markalar, modeller, nesiller, parçalar, OEM numaraları |

---

## Teknoloji Yığını

### Frontend
| Paket | Versiyon | Açıklama |
|---|---|---|
| Next.js | ^14.1.0 | App Router, SSR/SSG, Route Handlers |
| React | ^18.2.0 | UI kütüphanesi |
| TypeScript | ^5.3.3 | Strict mode aktif |
| Tailwind CSS | ^3.4.1 | Utility-first CSS |
| lucide-react | ^0.314.0 | İkon seti |
| @vercel/speed-insights | ^1.3.1 | Performans izleme |

### Backend
| Teknoloji | Açıklama |
|---|---|
| PHP 8+ | REST API — PDO, HS256 JWT, file-based rate limiter |
| MySQL | Kullanıcı, sipariş, ürün veritabanı (utf8mb4_unicode_ci) |
| SQLite | Read-only araç kataloğu (WAL mod, 64MB cache) |

### Deploy
| Servis | Kullanım |
|---|---|
| Vercel | Next.js frontend (fra1 region) |
| Natro | PHP backend (Shared hosting) |

---

## Dizin Yapısı

```
parcabizden/
├── src/
│   ├── app/                        # Next.js App Router sayfaları
│   │   ├── layout.tsx              # Root layout (Header, Footer, Providers)
│   │   ├── page.tsx                # Anasayfa
│   │   ├── parcalar/               # Parça katalog sayfaları
│   │   │   ├── page.tsx            # Marka/model/nesil/kategori gezinti
│   │   │   ├── layout.tsx
│   │   │   ├── error.tsx
│   │   │   └── [kategori]/[parca]/ # Kategori landing sayfaları (SEO)
│   │   ├── parca/[oem]/            # OEM numarasına göre parça detay
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── urun/[slug]/            # Shop ürün detay sayfası
│   │   ├── urunler/                # Ürün listeleme
│   │   ├── sepet/                  # Sepet & sipariş tamamlama
│   │   ├── ai-asistan/             # Türkçe doğal dil parça arama
│   │   ├── garaj/                  # /hesabim/garaj'a redirect
│   │   ├── hesabim/                # Kullanıcı hesap sayfaları
│   │   │   ├── layout.tsx          # Auth guard
│   │   │   ├── page.tsx            # Hesap özeti
│   │   │   ├── profil/             # Profil düzenleme
│   │   │   ├── garaj/              # Araç garajı + bakım planı
│   │   │   ├── siparisler/         # Sipariş geçmişi
│   │   │   ├── favoriler/          # Favori ürünler
│   │   │   ├── adresler/           # Adres yönetimi
│   │   │   └── ayarlar/            # Şifre değişikliği, hesap silme
│   │   ├── admin/                  # Admin paneli
│   │   │   ├── layout.tsx          # Admin auth guard + inactivity timeout
│   │   │   ├── page.tsx            # Dashboard (istatistikler)
│   │   │   ├── urunler/            # Ürün listesi, ekleme, düzenleme
│   │   │   │   └── zenginlestir/   # OEM ile otomatik ürün zenginleştirme
│   │   │   └── siparisler/         # Sipariş yönetimi
│   │   ├── giris/                  # Giriş sayfası
│   │   ├── kayit/                  # Kayıt sayfası
│   │   ├── dogrula/                # Email doğrulama
│   │   ├── sifremi-unuttum/        # Şifre sıfırlama talebi
│   │   ├── sifre-sifirla/          # Şifre sıfırlama
│   │   ├── iletisim/               # İletişim sayfası
│   │   ├── hakkimizda/             # Hakkımızda
│   │   ├── gizlilik/               # Gizlilik politikası (KVKK)
│   │   ├── kullanim-sartlari/      # Kullanım şartları
│   │   ├── api/                    # Next.js Route Handlers (proxy)
│   │   │   ├── brands/route.ts     # Marka listesi proxy
│   │   │   ├── generations/route.ts # Nesil listesi proxy (1h cache)
│   │   │   └── chat/
│   │   │       ├── route.ts        # Chat mesaj gönderme + rate limit
│   │   │       └── messages/route.ts # Chat mesaj okuma
│   │   ├── sitemap.ts              # Dinamik XML sitemap
│   │   ├── robots.ts               # robots.txt
│   │   ├── opengraph-image.tsx     # OG image generator
│   │   ├── icon.tsx                # Favicon generator
│   │   └── apple-icon.tsx          # Apple touch icon generator
│   │
│   ├── components/                 # Yeniden kullanılabilir UI bileşenleri
│   │   ├── Header.tsx              # Navigasyon, arama, auth durumu
│   │   ├── Footer.tsx              # Footer linkleri, iletişim
│   │   ├── HeroSection.tsx         # Ana sayfa VIN/OEM arama + parça listesi
│   │   ├── ChassisSearch.tsx       # VIN decode + araç parça arama (tam sayfa)
│   │   ├── VehicleSelector.tsx     # Marka→Model→Nesil akordeon seçici (browse & garage modu)
│   │   ├── BrandModelSelector.tsx  # Marka+model dropdown seçici
│   │   ├── BrandPicker.tsx         # Marka logo grid seçici
│   │   ├── BrandBar.tsx            # Horizontal marka logo bandı
│   │   ├── BrandLogos.tsx          # BrandLogo bileşeni (webp + fallback)
│   │   ├── PopularBrands.tsx       # Anasayfa popüler markalar grid
│   │   ├── ProductCard.tsx         # Ürün kartı (fiyat, stok, favori)
│   │   ├── PartDetailModal.tsx     # OEM parça detay modal
│   │   ├── PartDiagram.tsx         # Parça diyagram görüntüleyici
│   │   ├── CategoryDropdown.tsx    # Kategori dropdown menü
│   │   ├── CategoryIcons.tsx       # Kategori ikon + renk eşlemeleri
│   │   ├── AddVehicleModal.tsx     # Garaja araç ekleme modal
│   │   ├── GarageCard.tsx          # Garaj araç kartı
│   │   ├── MaintenanceForm.tsx     # Bakım kaydı ekleme/düzenleme formu
│   │   ├── ChatWidget.tsx          # Canlı chat widget (ticket tabanlı)
│   │   ├── CartIcon.tsx            # Header sepet ikonu + badge
│   │   ├── SchemaOrg.tsx           # JSON-LD Schema.org markup
│   │   ├── Breadcrumb.tsx          # Breadcrumb navigasyon
│   │   ├── Pagination.tsx          # Sayfalama bileşeni
│   │   ├── Tabs.tsx                # Tab navigasyon
│   │   ├── Skeleton.tsx            # Loading skeleton'ları
│   │   ├── EmptyState.tsx          # Boş durum gösterimi
│   │   ├── Toast.tsx               # Toast bildirim
│   │   ├── Badge.tsx               # Durum badge'i
│   │   ├── Tooltip.tsx             # Tooltip
│   │   ├── BackToTop.tsx           # Sayfa başına dön butonu
│   │   └── CookieConsent.tsx       # KVKK cookie consent banner
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Kullanıcı auth state (JWT token yönetimi)
│   │   ├── CartContext.tsx         # Sepet state (localStorage kalıcılığı)
│   │   └── ToastContext.tsx        # Global toast bildirimi
│   │
│   ├── lib/
│   │   ├── api.ts                  # Tüm backend API çağrıları (698 satır, 50+ fonksiyon)
│   │   ├── config.ts               # Site konfigürasyonu, WhatsApp URL yardımcıları
│   │   ├── vehicle.ts              # VIN decode, araç adı formatlamaları, yardımcılar
│   │   ├── vehicleImage.ts         # Araç görsel URL eşlemeleri
│   │   ├── smart-search.ts         # Türkçe→İngilizce parça anahtar kelime eşleme motoru
│   │   ├── oem-prefix.ts           # OEM prefix'ten marka tahmini (VW Group, BMW, Mercedes vb.)
│   │   ├── products.ts             # Ürün fetch yardımcıları, fiyat formatlaması
│   │   ├── maintenance.ts          # Bakım türleri, bakım durumu hesaplama
│   │   └── brand-groups.ts         # Otomotiv grup tanımları (VAG, Stellantis, BMW Group vb.)
│   │
│   ├── data/
│   │   ├── parts.ts                # Statik parça kataloğu (fallback)
│   │   ├── categories.ts           # 17 araç parça kategorisi tanımı
│   │   └── part-descriptions.ts    # Parça açıklamaları (SEO metinleri)
│   │
│   └── types/
│       ├── api.ts                  # Tüm backend API TypeScript tipleri
│       ├── shop.ts                 # ShopProduct, CartItem tipleri
│       └── vehicle.ts              # VehicleInfo, NHTSAResult tipleri
│
├── api/                            # PHP Backend (api.parcabizden.com.tr)
│   ├── index.php                   # Ana router — segment bazlı URL dispatch
│   ├── config.php                  # .env loader, DB sabitleri, CORS, güvenlik başlıkları
│   ├── db.php                      # Database + CatalogDB singleton PDO sınıfları
│   ├── auth.php                    # JWT encode/decode, auth handler fonksiyonları
│   ├── rate_limit.php              # Dosya tabanlı RateLimiter sınıfı
│   ├── .env                        # Ortam değişkenleri (git'e dahil değil)
│   ├── tmp/rate_limits/            # Rate limit dosyaları (.htaccess ile korumalı)
│   └── endpoints/
│       ├── brands.php              # GET /brands — marka listesi
│       ├── models.php              # GET /models?brand_id= — model listesi
│       ├── segments.php            # GET /segments?model_id= — nesil/segment listesi
│       ├── years.php               # GET /years?segment_id= — yıl listesi
│       ├── parts.php               # GET /parts — parça listesi (brand+gen+cat filtreli)
│       ├── categories.php          # GET /categories — parça kategorileri
│       ├── search.php              # GET/POST /search — OEM + text arama
│       ├── vehicle-detail.php      # GET /vehicle-detail — araç teknik detayları
│       ├── cross-ref.php           # GET /cross-ref — OEM çapraz referans
│       ├── legacy.php              # ?action= parametreli eski API uyumluluğu
│       ├── auth/
│       │   ├── register.php        # POST /auth/register
│       │   ├── login.php           # POST /auth/login
│       │   └── profile.php         # GET/POST /auth/profile
│       └── garage/
│           ├── list.php            # GET /garage/list
│           ├── add.php             # POST /garage/add
│           └── remove.php          # DELETE /garage/remove
│
├── php-backend/                    # Natro'ya deploy edilen ek PHP modüller
│   ├── auth.php                    # Genişletilmiş auth (email doğrulama, şifre sıfırlama)
│   ├── security.php                # IP kara liste, başarısız giriş takibi, audit log
│   ├── addresses.php               # Adres CRUD
│   ├── orders.php                  # Sipariş oluşturma, listeleme
│   ├── admin-orders.php            # Admin sipariş yönetimi
│   ├── admin-products.php          # Admin ürün yönetimi
│   ├── products.php                # Ürün listeleme, detay, arama
│   ├── favorites.php               # Favori ürün ekleme/çıkarma
│   ├── garage.php                  # Garaj CRUD, bakım kayıtları
│   ├── profile.php                 # Profil güncelleme, şifre değişikliği, hesap silme
│   ├── chat.php                    # Chat ticket oluşturma, mesaj gönderme/okuma
│   ├── reviews.php                 # Ürün değerlendirmeleri
│   ├── email.php                   # Email gönderme yardımcıları
│   ├── autodata.php                # Autodata katalog sorguları (nesil, parça, OEM)
│   ├── catalog.php                 # Genel katalog sorguları
│   ├── password.php                # Şifre sıfırlama token yönetimi
│   ├── image-import.php            # Ürün görseli içe aktarma
│   ├── migrate-7zap.php            # 7zap.com veri migrasyonu
│   ├── migration.sql               # Ana veritabanı şeması
│   ├── migration-admin.sql         # Admin tabloları (is_admin, audit_log, ip_blacklist)
│   └── KURULUM.md                  # Natro kurulum rehberi
│
├── public/
│   ├── brands/                     # Marka logo görselleri (.webp)
│   ├── site.webmanifest            # PWA manifest
│   └── ...
│
├── scripts/                        # Utility script'ler
├── next.config.js                  # Next.js konfigürasyonu
├── next-env.d.ts
├── tailwind.config.ts              # Tailwind tema (primary/secondary/dark renk paleti)
├── tsconfig.json                   # TypeScript strict mode
├── vercel.json                     # Vercel deploy konfigürasyonu (fra1)
└── package.json
```

---

## Veritabanı

### MySQL — Kullanıcı & E-Ticaret Tabloları

Bağlantı: `utf8mb4_unicode_ci` charset, `utf8mb4_turkish_ci` collation (sıralama)

#### `users`
| Kolon | Tip | Açıklama |
|---|---|---|
| id | INT PK AI | |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | bcrypt cost=12 |
| name | VARCHAR(100) | |
| phone | VARCHAR(20) | |
| email_verified | TINYINT(1) | Şu an 1 (doğrulama pasif) |
| is_admin | TINYINT(1) DEFAULT 0 | Admin yetkisi |
| gsm | VARCHAR(20) | |
| address_line1/2 | VARCHAR(255) | Profil adresi |
| city, district, postal_code | VARCHAR | |
| tc_no | VARCHAR(11) | |
| deleted_at | TIMESTAMP | Soft delete |

#### `products`
| Kolon | Tip | Açıklama |
|---|---|---|
| id | INT PK AI | |
| name | VARCHAR(255) | |
| slug | VARCHAR(255) UNIQUE | URL slug |
| oem_number | VARCHAR(100) | OEM parça numarası |
| brand_name | VARCHAR(100) | Ürün markası |
| brand_logo | VARCHAR(255) | Logo dosya yolu |
| category | VARCHAR(50) | Kategori slug'ı |
| price | DECIMAL(10,2) | Normal fiyat |
| discount_price | DECIMAL(10,2) | İndirimli fiyat |
| images | JSON | Görsel URL listesi |
| thumbnail | VARCHAR(255) | Küçük resim |
| specs | JSON | Teknik özellikler (key-value) |
| description | TEXT | Açıklama |
| compatible_vehicles | JSON | Uyumlu araç listesi |
| in_stock | TINYINT(1) DEFAULT 1 | Stok durumu |
| is_consumable | TINYINT(1) DEFAULT 0 | Sarf malzeme mi? |
| tags | JSON | Etiketler |

#### `orders`
| Kolon | Tip | Açıklama |
|---|---|---|
| id | INT PK AI | |
| user_id | INT | |
| order_no | VARCHAR(20) UNIQUE | Sipariş numarası |
| status | ENUM | pending/confirmed/shipped/delivered/cancelled |
| total_price | DECIMAL(10,2) | |
| address_id | INT | |
| notes | TEXT | |

#### `order_items`
| Kolon | Tip | Açıklama |
|---|---|---|
| order_id | INT FK→orders | CASCADE DELETE |
| product_id | INT | (nullable — fiyatsız talep) |
| product_name | VARCHAR(255) | |
| quantity | INT | |
| unit_price | DECIMAL(10,2) | |
| has_price | TINYINT(1) | Fiyatlı/fiyatsız ayrımı |

#### `addresses`
Kullanıcı teslimat adresleri: `title`, `full_name`, `phone`, `address_line1/2`, `city`, `district`, `postal_code`, `is_default`

#### `favorites`
`user_id + product_id` unique constraint. Favori ürün listesi.

#### `admin_audit_log`
`user_id`, `action`, `target_id`, `details`, `ip` — Admin işlem geçmişi.

#### `ip_blacklist`
`ip`, `reason`, `expires_at` — Brute force sonrası IP engelleme.

### Migration Çalıştırma

```bash
# phpMyAdmin veya SSH üzerinden:
mysql -u user -p parcabizden < php-backend/migration.sql
mysql -u user -p parcabizden < php-backend/migration-admin.sql
```

Her iki dosya da `IF NOT EXISTS` / stored procedure güvencesi ile idempotent'tir.

### SQLite — Araç Kataloğu (`parcabizden_v3.db`)

Read-only katalog veritabanı. API sunucusunda `CATALOG_DB_PATH` ortam değişkeni ile konumu belirlenir.

**Performans ayarları (otomatik açılır):**
```sql
PRAGMA journal_mode = WAL;
PRAGMA cache_size = -64000;    -- 64 MB cache
PRAGMA mmap_size = 268435456;  -- 256 MB mmap
PRAGMA temp_store = MEMORY;
```

**Temel tablolar (katalog):**
- `manufacturers` — Marka listesi (slug, logo)
- `models` — Model listesi (brand_id FK)
- `vehicle_generations` / `segments` — Nesil/segment (yıl, kasa tipi, motor tipi)
- `parts` — OEM parça tanımları (oem_number, name, category, part_type)
- `vehicle_nodes` — Parça ağacı hiyerarşisi (node_name, node_name_en, parent)
- `vehicle_parts` — Node–parça ilişkisi
- `pos4` — VIN pos4 kodu → model eşlemesi (VIN decode yardımcısı)

---

## Backend (PHP API)

**Base URL:** `https://api.parcabizden.com.tr`

### Router (`api/index.php`)

Segment tabanlı URL dispatch + legacy `?action=` desteği:

```
GET  /brands                  → endpoints/brands.php
GET  /models?brand_id=        → endpoints/models.php
GET  /segments?model_id=      → endpoints/segments.php
GET  /years?segment_id=       → endpoints/years.php
GET  /parts                   → endpoints/parts.php
GET  /categories              → endpoints/categories.php
GET  /search                  → endpoints/search.php
GET  /vehicle-detail          → endpoints/vehicle-detail.php
GET  /cross-ref               → endpoints/cross-ref.php
POST /auth/register           → endpoints/auth/register.php
POST /auth/login              → endpoints/auth/login.php
GET  /auth/profile            → endpoints/auth/profile.php
GET  /garage/list             → endpoints/garage/list.php
POST /garage/add              → endpoints/garage/add.php
DELETE /garage/remove         → endpoints/garage/remove.php

# Legacy action parametreli endpoint'ler (?action=...):
?action=brands                → autodata marka listesi
?action=generations&brand=    → nesil listesi
?action=vehicle_categories    → parça kategorileri
?action=vehicle_nodes         → parça ağacı
?action=vehicle_parts         → parça listesi (paginated)
?action=search_oem            → OEM arama
?action=autodata_brands       → Autodata marka listesi
?action=autodata_models       → Autodata model listesi
?action=autodata_generations  → Autodata nesil listesi
?action=resolve_slug          → Slug → generation_slug çözümü
?action=diagram_url           → Parça diyagram URL
?action=vehicle_specs         → Araç teknik detayları
?action=garage_list/add/update/remove
?action=maintenance_list/add/update/remove
?action=profile_update
?action=profile_full
?action=address_list/add/update/remove
?action=order_list/detail/create
?action=admin_order_list/update_status
?action=favorite_list/add/remove
?action=product_list/detail/search
?action=admin_product_add/update/delete
?action=change_password
?action=delete_account
?action=chat                  → Chat mesaj gönder
?action=chat_messages         → Chat mesajları oku
```

### Rate Limiting (`api/rate_limit.php`)

Dosya tabanlı `RateLimiter` sınıfı (`api/tmp/rate_limits/`):

| Tip | Limit | Pencere |
|---|---|---|
| `auth` | 5 istek | 15 dakika |
| `search` | 30 istek | 1 dakika |
| `general` | 60 istek | 1 dakika |

- IP tespiti: Cloudflare (`CF-Connecting-IP`) → Proxy (`X-Forwarded-For`) → `REMOTE_ADDR`
- Dosyalar MD5 hash ile adlandırılır (directory traversal koruması)
- `tmp/rate_limits/.htaccess` ile web erişimi engellenir
- `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Window` header'ları döner

### CORS

`config.php`'de izin verilen originler:
- `https://parcabizden.com.tr`
- `https://www.parcabizden.com.tr`
- `*.vercel.app` (preview deployment'lar)
- `localhost:*` (geliştirme ortamı, `APP_ENV !== production`)

---

## Frontend (Next.js)

### Sayfa Yapısı

| Route | Bileşen | Açıklama |
|---|---|---|
| `/` | `app/page.tsx` | HeroSection (VIN/OEM arama) + Popüler Markalar + Özellikler |
| `/parcalar` | `app/parcalar/page.tsx` | Marka→Model→Nesil→Kategori→Parça gezinti akışı |
| `/parca/[oem]` | `app/parca/[oem]/page.tsx` | OEM numarasına göre parça detay ve fiyat |
| `/urun/[slug]` | `app/urun/[slug]/page.tsx` | Shop ürün detay sayfası |
| `/urunler` | `app/urunler/page.tsx` | Ürün listeleme + filtre |
| `/ai-asistan` | `app/ai-asistan/page.tsx` | Türkçe doğal dil parça arama |
| `/sepet` | `app/sepet/page.tsx` | Sepet + adres seçimi + sipariş |
| `/giris` | `app/giris/page.tsx` | Giriş formu |
| `/kayit` | `app/kayit/page.tsx` | Kayıt formu |
| `/hesabim` | `app/hesabim/layout.tsx` | Auth guard layout |
| `/hesabim/garaj` | Garaj listesi + araç ekleme |
| `/hesabim/garaj/[id]` | Araç detay + bakım planı |
| `/hesabim/siparisler` | Sipariş listesi |
| `/hesabim/favoriler` | Favori ürünler |
| `/hesabim/adresler` | Adres yönetimi |
| `/hesabim/profil` | Profil düzenleme |
| `/hesabim/ayarlar` | Şifre + hesap silme |
| `/admin` | `app/admin/layout.tsx` | Admin guard (is_admin kontrolü) |
| `/admin/urunler` | Ürün listesi + CRUD |
| `/admin/urunler/zenginlestir` | OEM → otomatik ürün bilgisi doldurma |
| `/admin/siparisler` | Sipariş yönetimi |

### Next.js Route Handlers (Proxy)

Bazı API çağrıları CORS veya caching nedeniyle Next.js üzerinden proxy'lenir:

| Route | Fonksiyon |
|---|---|
| `/api/brands` | PHP API'ye proxy, `force-dynamic` |
| `/api/generations?brand=` | 1 saatlik `s-maxage` cache |
| `/api/chat` | Mesaj gönderme + in-memory rate limit (10 req/dk) |
| `/api/chat/messages` | Mesaj okuma + in-memory rate limit (30 req/dk) |

> **Dikkat:** In-memory rate limit (`Map`) Vercel serverless ortamında instance'lar arası paylaşılmaz; production'da Vercel KV veya Upstash Redis kullanılmalıdır.

### State Yönetimi (Context API)

#### `AuthContext`
- JWT token `localStorage`'da tutulur (`token` key)
- Token expiry her dakika ve her tab odak değişiminde kontrol edilir
- `isTokenExpired()` fonksiyonu ile client-side doğrulama
- Sayfa görünürlüğü değişiminde (`visibilitychange`) `/auth/profile` endpoint'i çağrılır

#### `CartContext`
- Sepet `localStorage`'da tutulur (`parcabizden_cart` key)
- SSR hydration uyumsuzluğu için `mounted` state guard
- `getWhatsAppCartUrl()` — sepet içeriğini WhatsApp mesajı olarak formatlar
- Hem fiyatlı (sipariş) hem fiyatsız (talep) ürünler desteklenir

#### `ToastContext`
- Global toast bildirimi (success/error/warning)
- `Toast.tsx` bileşeni ile render

### Renk Paleti (Tailwind)

| Token | Değer | Kullanım |
|---|---|---|
| `primary-500` | `#f9ac1b` | Ana renk (sarı/altın) |
| `secondary-500` | `#3c4f82` | İkincil renk (koyu mavi) |
| `dark-900` | `#131721` | Header arka planı |

---

## Kimlik Doğrulama

### JWT Implementasyonu (PHP)

```
Header:  {"typ":"JWT","alg":"HS256"}
Payload: {"user_id":..., "iat":..., "exp":...}
Secret:  JWT_SECRET ortam değişkeni
Expiry:  86400 saniye (24 saat)
```

- `hash_hmac('sha256', ..., JWT_SECRET, true)` + `hash_equals()` ile timing-safe doğrulama
- Token `Authorization: Bearer <token>` header'ı ile iletilir
- `get_auth_user_id()` fonksiyonu her korumalı endpoint'te çağrılır

### Şifre Güvenliği

```php
password_hash($password, PASSWORD_BCRYPT, ['cost' => 12])
```

Kayıt validasyonu: min 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam zorunlu.

### Admin Yetkilendirme

`requireAdmin($db, $userId)` fonksiyonu:
```php
$stmt = $db->prepare('SELECT is_admin FROM users WHERE id = :id');
$stmt->execute([':id' => $userId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row || !$row['is_admin']) jsonResponse(['error' => 'Yetkisiz erisim'], 403);
```

Admin panelinde ayrıca 30 dakika hareketsizlik zaman aşımı uygulanır (`AdminLayout`).

---

## Sepet & Sipariş Sistemi

### Sepet Akışı

```
Kullanıcı parça seçer
    → CartContext.addItem()
    → localStorage['parcabizden_cart'] güncellenir
    → /sepet sayfasında:
        ├── Fiyatlı ürünler → sipariş oluşturulabilir
        ├── Fiyatsız ürünler → WhatsApp talebi
        └── Tüm sepet → WhatsApp'a gönder butonu
```

### Sipariş Oluşturma

```
/sepet → adres seçimi → api.orderCreate()
    → POST /?action=order_create
    → PHP: orders tablosuna INSERT
    → order_items tablosuna INSERT (her ürün için)
    → clearCart() → sipariş numarası gösterilir
```

**Sipariş durumları:** `pending` → `confirmed` → `shipped` → `delivered` / `cancelled`

### WhatsApp Entegrasyonu

`src/lib/config.ts`'teki `getWhatsAppUrl(message)` fonksiyonu:

```
https://wa.me/905449819144?text=<encoded_message>
```

Kullanım noktaları:
- Parça detay sayfasında "Fiyat Sor" butonu
- Sepet içeriğini WhatsApp'a gönder
- Parça bulunamadı durumunda yardım talebi

---

## Araç Kataloğu & Parça Arama

### VIN Decode Akışı

```
Kullanıcı 17 karakterlik VIN girer
    → validateVIN() — format kontrolü (IOQ hariç, alfanumerik)
    → decodeVIN() → NHTSA API çağrısı
    → VehicleInfo oluşturulur (marka, model, yıl, motor vb.)
    → fetchGenerations(brandSlug) → SQLite katalogdan nesiller
    → Yıl bazlı en yakın nesil otomatik seçilir
    → fetchVehicleCategories() → 17 kategori yüklenir
    → Kullanıcı kategori seçer → fetchVehicleNodes() → parça ağacı
    → Node seçilir → fetchVehicleParts() → OEM parça listesi
```

### OEM Arama Akışı

```
Kullanıcı OEM numarası girer (ör: 1K0615301)
    → oem-prefix.ts ile marka tahmini (VW Group → "volkswagen")
    → searchOemParts(query) → SQLite arama
    → Parça adı, kategori, araç uyumluluğu gösterilir
    → /parca/[oem] sayfasına yönlendirme
```

### Akıllı Türkçe Arama (`/ai-asistan`)

`src/lib/smart-search.ts`:
- Kullanıcı Türkçe yazar (ör: "amortisör", "far", "fren diski")
- `parseSmartQuery()` → Türkçe→İngilizce anahtar kelime listesi
- `getTargetCategories()` → İlgili kategoriler belirlenir
- Eşleşen node'lar vehicle_nodes üzerinde filtrelenir
- Sonuçlar OEM numarası ile listelenir

**Desteklenen Türkçe terimler (örnekler):**
`amortisör`, `yay`, `salıncak`, `rotil`, `fren diski`, `balata`, `far`, `enjektör`, `turbo`, `radyatör`, `alternator`, `marş`, `triger kayışı`, `egzoz`, `klima kompresörü`, `abs`, `kontrol kolu`, `silecek`, `koltuk`, `airbag`, `kaput`, `çamurluk`, `tampon`

### OEM Prefix'ten Marka Tahmini (`src/lib/oem-prefix.ts`)

VW Group, BMW, Mercedes-Benz, Ford, Toyota, Renault, Peugeot/Citroën, Opel/Vauxhall ve diğer büyük gruplar için prefix pattern eşlemesi.

Güven seviyeleri: `high` | `medium`

---

## Admin Paneli

**Route:** `/admin` — `is_admin = 1` olan kullanıcılara açık.

### Dashboard
- Toplam ürün sayısı
- Toplam sipariş sayısı
- Bekleyen sipariş sayısı
- Son 5 sipariş listesi

### Ürün Yönetimi (`/admin/urunler`)
- Ürün listeleme, arama, filtreleme
- Yeni ürün ekleme (`/admin/urunler/yeni`)
- Ürün düzenleme (`/admin/urunler/[id]`)
- Ürün silme

### Ürün Zenginleştirme (`/admin/urunler/zenginlestir`)
OEM numarası girilerek SQLite katalogdan otomatik bilgi doldurma: parça adı, kategori, uyumlu araçlar.

### Sipariş Yönetimi (`/admin/siparisler`)
- Sipariş listeleme (sayfalı)
- Durum güncelleme (pending/confirmed/shipped/delivered/cancelled)
- Sipariş detay görüntüleme

---

## SEO & Performans

### Meta & Open Graph

`app/layout.tsx`'te global metadata:
- `title` template: `%s | ParcaBizden`
- `description`, `keywords` (Türkçe parça anahtar kelimeleri)
- Open Graph (tr_TR locale, website type)
- Twitter card (summary_large_image)
- `metadataBase`: `https://parcabizden.com.tr`

### Schema.org (JSON-LD)

`SchemaOrg.tsx` bileşeni her sayfaya dahil edilir:
- `Organization` schema
- `AutoPartsStore` (LocalBusiness) schema
- `WebSite` + `SearchAction` schema
- Breadcrumb listesi
- FAQ schema (anasayfa)

### Sitemap

`app/sitemap.ts` — dinamik XML sitemap:
- Statik sayfalar (priority 1.0 → 0.3)
- Kategori landing sayfaları (17 kategori kombinasyonu)
- Tüm aktif ürün OEM URL'leri (`/parca/[oem]`)

### robots.txt

```
Disallow: /api/, /hesabim/, /giris, /kayit, /admin/, /sepet, ...
Sitemap: https://parcabizden.com.tr/sitemap.xml
```

### Görsel Optimizasyon

`next.config.js` → `remotePatterns`:
- `parcabizden.com.tr`
- `api.parcabizden.com.tr`
- `www.auto-data.net`

Marka logoları: `/public/brands/[slug].webp` formatında, `<Image>` bileşeni ile optimize.

### Performans

- `@vercel/speed-insights` entegrasyonu
- Lazy load: `ChatWidget`, `BackToTop`, `CookieConsent` → `dynamic()` ile SSR devre dışı
- `next/font/google` (Inter) — `display: swap`
- Brands API: `force-dynamic` (her request'te taze)
- Generations API: `s-maxage=3600, stale-while-revalidate=7200`
- Static brand görselleri: `max-age=604800, immutable`

---

## Güvenlik

### HTTP Security Headers

`next.config.js` + `api/config.php` + `vercel.json`:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### SQL Injection Koruması

Tüm sorgular PDO prepared statement kullanır:
```php
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
```

### PHP Hata Görünürlüğü

`config.php`:
```php
ini_set('display_errors', 0);  // Üretimde kapalı
ini_set('log_errors', 1);      // Log aktif
```

### Bilinen Dikkat Noktaları

| Konu | Durum | Not |
|---|---|---|
| JWT localStorage | XSS'e açık | HttpOnly cookie'ye taşımak daha güvenli |
| In-memory rate limit | Vercel'de çalışmaz | Vercel KV / Upstash Redis ile değiştirilmeli |
| `/tmp` rate limit | Shared hosting'de paylaşımlı olabilir | `api/tmp/` klasörü .htaccess ile korumalı |
| `email_verified = 1` hardcoded | Email doğrulama pasif | Email servisi aktifken 0 yapılacak |
| Admin client-side guard | UI katmanı — backend `requireAdmin()` asıl kontrol | Her admin endpoint'inde `requireAdmin()` çağrıldığı doğrulanmalı |

---

## Deploy & Ortam Değişkenleri

### Frontend (Vercel)

| Değişken | Açıklama | Örnek |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | PHP API base URL | `https://api.parcabizden.com.tr` |
| `NEXT_PUBLIC_CHAT_ENABLED` | Chat widget aktif/pasif | `true` |

### Backend (PHP — `api/.env`)

| Değişken | Açıklama |
|---|---|
| `DB_HOST` | MySQL host |
| `DB_NAME` | Veritabanı adı |
| `DB_USER` | MySQL kullanıcısı |
| `DB_PASS` | MySQL şifresi |
| `DB_CHARSET` | `utf8mb4` |
| `CATALOG_DB_PATH` | SQLite katalog dosya yolu |
| `JWT_SECRET` | JWT imzalama anahtarı (min 32 karakter) |
| `ERROR_LOG_PATH` | PHP hata log dosyası |
| `ALLOWED_ORIGIN` | İzin verilen CORS origin |
| `APP_ENV` | `production` / `development` |

### Vercel Konfigürasyonu (`vercel.json`)

```json
{
  "framework": "nextjs",
  "regions": ["fra1"]
}
```

### Natro Deploy

PHP backend Natro shared hosting'e `git push` ile otomatik deploy edilir. Her push anında canlıya geçer, zero-downtime yoktur.

---

## Geliştirme Ortamı Kurulumu

### Gereksinimler

- Node.js 18+
- PHP 8.0+ (local test için)
- MySQL 5.7+ veya 8.0+
- SQLite3

### Frontend

```bash
# Bağımlılıkları yükle
npm install

# Ortam değişkenlerini ayarla
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=https://api.parcabizden.com.tr

# Geliştirme sunucusu
npm run dev

# Production build
npm run build
npm run start

# Lint
npm run lint
```

### Backend (Local)

```bash
# 1. MySQL veritabanı oluştur
mysql -u root -p -e "CREATE DATABASE parcabizden CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Şemaları uygula
mysql -u root -p parcabizden < php-backend/migration.sql
mysql -u root -p parcabizden < php-backend/migration-admin.sql

# 3. .env dosyasını oluştur
cat > api/.env << EOF
DB_HOST=localhost
DB_NAME=parcabizden
DB_USER=root
DB_PASS=your_password
JWT_SECRET=your-very-long-random-secret-key-min-32-chars
CATALOG_DB_PATH=/path/to/parcabizden_v3.db
APP_ENV=development
EOF

# 4. PHP built-in server ile çalıştır
cd api && php -S localhost:8080
```

### Admin Kullanıcısı Oluşturma

Kayıt olduktan sonra MySQL'de:
```sql
UPDATE users SET is_admin = 1 WHERE email = 'admin@parcabizden.com';
```

---

## Bakım Planı Sistemi

Kullanıcı garajında her araç için bakım takibi:

**Bakım türleri:** Yağ değişimi (10.000 km), Fren balatası (30.000 km), Hava filtresi (20.000 km), Polen filtresi (15.000 km), Yakıt filtresi (40.000 km), Buji (30.000 km), Lastik rotasyonu (10.000 km), Antifriz (40.000 km), Triger kayışı (60.000 km)

**Durum hesaplama (`src/lib/maintenance.ts`):**
- `overdue` — Sonraki km geçilmişse veya tarih geçmişse
- `upcoming` — Sonraki km'ye 1.000 km veya daha az kaldıysa
- `ok` — Normal durum

---

*Bu dokümantasyon ParcaBizden v1.0 için hazırlanmıştır. Son güncelleme: Nisan 2026.*
