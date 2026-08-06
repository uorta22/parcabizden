-- ═══════════════════════════════════════════════════════════════
-- Pazaryeri Çekirdek Şeması — Faz 1
-- ═══════════════════════════════════════════════════════════════
-- Ürün: çıkma/yedek parça iki taraflı pazaryeri.
-- Referans modeller: cikmaparcacin.com (ilan + SEO) ve
-- talep.otodevi.com (talep → teklif → ödeme).
--
-- TASARIM KARARLARI (rakiplerde gözlemlenen açıklara karşı):
--
--  1. İlan birincil varlıktır, katalog referanstır.
--     Çıkma parça tekil bir fiziksel nesnedir; katalog envanteri
--     tanımlamaz, sadece "hangi araca ait" sorusunu cevaplar.
--     Bu yüzden catalog_* bağları NULLABLE.
--
--  2. Uyum beyan değil, kaynağı işaretli.
--     cikmaparcacin ilan sayfasında "kesin uyum için OEM'i kendi
--     aracınızla doğrulayın" diyor — yani uyumu alıcıya yıkıyor.
--     Biz uyumun NEREDEN geldiğini saklıyoruz (fitment_source) ve
--     katalogdan doğrulanmışsa bunu rozet olarak gösterebiliyoruz.
--
--  3. Tazelik zorunlu.
--     Rakipte satış WhatsApp'ta kapandığı için platform ilanın
--     satıldığını asla öğrenemiyor; 530K ilanın ne kadarının hâlâ
--     mevcut olduğu bilinmiyor. expires_at + last_confirmed_at ile
--     teyit edilmeyen ilan otomatik pasife düşer.
--
--  4. Fiyatsız ilan yok.
--     Rakipte ilanların çoğu "Fiyat Sorunuz" — karşılaştırma
--     imkânsız. Ya net fiyat ya da bant zorunlu (CHECK ile).
--
--  5. Güven davranıştan üretilir, beyandan değil.
--     Teklif döngüsü platformda kaldığı için yanıt süresi ve
--     kapanma oranı ölçülebilir. Yıldız değil, davranış.
-- ═══════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- ── Coğrafya ──────────────────────────────────────────────────
-- Rakipte şehir serbest metin; filtreleme ve SEO için normalize.
CREATE TABLE IF NOT EXISTS cities (
    id        SMALLINT UNSIGNED PRIMARY KEY,      -- plaka kodu
    name      VARCHAR(50)  NOT NULL,
    slug      VARCHAR(50)  NOT NULL,
    UNIQUE KEY uq_cities_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS districts (
    id        MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    city_id   SMALLINT UNSIGNED NOT NULL,
    name      VARCHAR(80) NOT NULL,
    slug      VARCHAR(80) NOT NULL,
    UNIQUE KEY uq_districts (city_id, slug),
    CONSTRAINT fk_districts_city FOREIGN KEY (city_id) REFERENCES cities(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ── Satıcı / mağaza ───────────────────────────────────────────
-- Bugünkü kodda satıcı kavramı HİÇ yok; users.is_admin tek rol.
-- Doğrulama rakibin en güçlü güven sinyali: vergi levhası + manuel onay.
CREATE TABLE IF NOT EXISTS sellers (
    id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id            INT UNSIGNED NOT NULL,
    name               VARCHAR(150) NOT NULL,
    slug               VARCHAR(160) NOT NULL,
    city_id            SMALLINT UNSIGNED NOT NULL,
    district_id        MEDIUMINT UNSIGNED DEFAULT NULL,
    address            VARCHAR(400) DEFAULT NULL,
    whatsapp           VARCHAR(20)  DEFAULT NULL,
    phone              VARCHAR(20)  DEFAULT NULL,

    -- Doğrulama
    tax_number         VARCHAR(20)  DEFAULT NULL,
    tax_document_path  VARCHAR(255) DEFAULT NULL,
    status             ENUM('pending','approved','suspended','rejected') NOT NULL DEFAULT 'pending',
    approved_at        DATETIME DEFAULT NULL,
    rejection_reason   VARCHAR(255) DEFAULT NULL,

    -- Davranış tabanlı güven (nightly job ile hesaplanır, beyan değil)
    median_response_minutes  SMALLINT UNSIGNED DEFAULT NULL,
    offer_rate               DECIMAL(4,3) DEFAULT NULL,  -- gelen talebe teklif verme oranı
    listing_freshness_rate   DECIMAL(4,3) DEFAULT NULL,  -- teyit edilmiş ilan oranı

    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_sellers_slug (slug),
    UNIQUE KEY uq_sellers_user (user_id),
    KEY idx_sellers_city_status (city_id, status),
    CONSTRAINT fk_sellers_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_sellers_city FOREIGN KEY (city_id) REFERENCES cities(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ── İlan ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    seller_id      INT UNSIGNED NOT NULL,
    title          VARCHAR(200) NOT NULL,
    slug           VARCHAR(220) NOT NULL,
    description    TEXT DEFAULT NULL,

    -- Araç bağı: katalog referans, envanter değil. Serbest metin
    -- alanları katalogda karşılığı olmayan araçlar için fallback.
    vehicle_id       INT UNSIGNED DEFAULT NULL,   -- catalog_vehicles.id (KType)
    model_id         INT UNSIGNED DEFAULT NULL,   -- catalog_models.id
    manufacturer_id  INT UNSIGNED DEFAULT NULL,   -- catalog_manufacturers.id
    vehicle_label    VARCHAR(150) DEFAULT NULL,   -- "BMW 3 (E46) 318 d"
    year_from        SMALLINT UNSIGNED DEFAULT NULL,
    year_to          SMALLINT UNSIGNED DEFAULT NULL,

    -- Parça
    category_id    INT UNSIGNED DEFAULT NULL,     -- catalog_categories.id
    part_label     VARCHAR(150) NOT NULL,         -- "Stop Lambası"
    oem_number     VARCHAR(100) DEFAULT NULL,

    -- Uyum kaynağı — rakibin alıcıya yıktığı sorumluluk burada saklanıyor
    fitment_source ENUM('seller_declared','catalog_verified','vin_verified')
                   NOT NULL DEFAULT 'seller_declared',

    -- Durum ve stok. Çıkma parça tekil nesnedir → varsayılan 1.
    condition_type ENUM('cikma','sifir','yenilenmis') NOT NULL DEFAULT 'cikma',
    quantity       SMALLINT UNSIGNED NOT NULL DEFAULT 1,

    -- Fiyat: net ya da bant. İkisi de boş olamaz (CHECK).
    price          DECIMAL(12,2) DEFAULT NULL,
    price_min      DECIMAL(12,2) DEFAULT NULL,
    price_max      DECIMAL(12,2) DEFAULT NULL,
    shipping_payer ENUM('buyer','seller','negotiable') NOT NULL DEFAULT 'buyer',

    -- Yaşam döngüsü
    status            ENUM('draft','pending_review','active','reserved','sold','expired','removed')
                      NOT NULL DEFAULT 'draft',
    published_at      DATETIME DEFAULT NULL,
    last_confirmed_at DATETIME DEFAULT NULL,   -- satıcı "hâlâ var" dedi
    expires_at        DATETIME DEFAULT NULL,   -- teyit edilmezse pasife düşer
    sold_at           DATETIME DEFAULT NULL,

    view_count     INT UNSIGNED NOT NULL DEFAULT 0,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_listings_slug (slug),
    KEY idx_listings_browse   (status, expires_at, manufacturer_id, model_id, category_id),
    KEY idx_listings_vehicle  (vehicle_id, status),
    KEY idx_listings_oem      (oem_number),
    KEY idx_listings_seller   (seller_id, status),
    KEY idx_listings_fresh    (status, last_confirmed_at),

    CONSTRAINT fk_listings_seller FOREIGN KEY (seller_id) REFERENCES sellers(id),
    CONSTRAINT chk_listings_price CHECK (price IS NOT NULL OR (price_min IS NOT NULL AND price_max IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS listing_images (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    listing_id   BIGINT UNSIGNED NOT NULL,
    path         VARCHAR(255) NOT NULL,
    sort_order   TINYINT UNSIGNED NOT NULL DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_listing_images (listing_id, sort_order),
    CONSTRAINT fk_listing_images FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ── Talep ─────────────────────────────────────────────────────
-- Rakipte talep modülü var ama ölü (6 aktif talep). Bizde çekirdek.
-- Üyeliksiz açılabilir (otodevi giriş zorunlu tutuyor, sürtünme yaratıyor).
CREATE TABLE IF NOT EXISTS requests (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id        INT UNSIGNED DEFAULT NULL,     -- NULL = misafir talep
    contact_phone  VARCHAR(20) NOT NULL,          -- misafir için zorunlu iletişim

    vehicle_id       INT UNSIGNED DEFAULT NULL,
    model_id         INT UNSIGNED DEFAULT NULL,
    manufacturer_id  INT UNSIGNED DEFAULT NULL,
    vehicle_label    VARCHAR(150) DEFAULT NULL,
    vin              VARCHAR(20) DEFAULT NULL,    -- otodevi şase no alıyor
    engine_number    VARCHAR(40) DEFAULT NULL,    -- otodevi motor no da alıyor

    city_id        SMALLINT UNSIGNED DEFAULT NULL,
    budget_max     DECIMAL(12,2) DEFAULT NULL,

    status         ENUM('open','matched','closed','expired','cancelled') NOT NULL DEFAULT 'open',
    expires_at     DATETIME NOT NULL,
    closed_at      DATETIME DEFAULT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    KEY idx_requests_open  (status, expires_at),
    KEY idx_requests_match (manufacturer_id, model_id, status),
    KEY idx_requests_user  (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Talep satırı — bir araç, birden çok parça.
-- otodevi bunu doğru kurmuş: alıcı 3 parça arıyorsa 3 ayrı talep açmıyor,
-- ve her satır için AYRI satıcıdan teklif kabul edebiliyor. Teklif bu yüzden
-- talebe değil satıra bağlanır.
CREATE TABLE IF NOT EXISTS request_items (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id     BIGINT UNSIGNED NOT NULL,
    category_id    INT UNSIGNED DEFAULT NULL,     -- catalog_categories.id
    part_label     VARCHAR(150) NOT NULL,
    oem_number     VARCHAR(100) DEFAULT NULL,
    quantity       SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    note           VARCHAR(500) DEFAULT NULL,
    status         ENUM('open','fulfilled','cancelled') NOT NULL DEFAULT 'open',
    KEY idx_request_items (request_id, status),
    KEY idx_request_items_match (category_id, status),
    CONSTRAINT fk_request_items FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS request_item_images (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_item_id  BIGINT UNSIGNED NOT NULL,
    path             VARCHAR(255) NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_request_item_images (request_item_id),
    CONSTRAINT fk_request_item_images FOREIGN KEY (request_item_id) REFERENCES request_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ── Talep → satıcı dağıtımı ───────────────────────────────────
-- Yanıt süresi ölçümünün kaynağı: gönderildi/görüldü zaman damgaları.
CREATE TABLE IF NOT EXISTS request_dispatches (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id   BIGINT UNSIGNED NOT NULL,
    seller_id    INT UNSIGNED NOT NULL,
    dispatched_at DATETIME NOT NULL,
    seen_at      DATETIME DEFAULT NULL,
    UNIQUE KEY uq_dispatch (request_id, seller_id),
    KEY idx_dispatch_seller (seller_id, dispatched_at),
    CONSTRAINT fk_dispatch_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_dispatch_seller  FOREIGN KEY (seller_id)  REFERENCES sellers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ── Teklif ────────────────────────────────────────────────────
-- Yapısal teklif: rakipte teklif serbest WhatsApp mesajı, karşılaştırılamıyor.
CREATE TABLE IF NOT EXISTS offers (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_item_id BIGINT UNSIGNED NOT NULL,      -- teklif satıra verilir, talebe değil
    seller_id       INT UNSIGNED NOT NULL,
    listing_id      BIGINT UNSIGNED DEFAULT NULL,  -- stoktan veriliyorsa bağla

    price           DECIMAL(12,2) NOT NULL,
    condition_type  ENUM('cikma','sifir','yenilenmis') NOT NULL,
    warranty_days   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    ships_in_days   TINYINT UNSIGNED DEFAULT NULL,
    shipping_payer  ENUM('buyer','seller','negotiable') NOT NULL DEFAULT 'buyer',
    note            VARCHAR(500) DEFAULT NULL,

    status          ENUM('sent','seen','accepted','rejected','withdrawn','expired')
                    NOT NULL DEFAULT 'sent',
    seen_at         DATETIME DEFAULT NULL,
    decided_at      DATETIME DEFAULT NULL,
    expires_at      DATETIME DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_offer_once (request_item_id, seller_id),  -- satıcı bir satıra tek teklif
    KEY idx_offers_item   (request_item_id, status, price), -- karşılaştırma sorgusu
    KEY idx_offers_seller (seller_id, created_at),
    CONSTRAINT fk_offers_item FOREIGN KEY (request_item_id) REFERENCES request_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_offers_seller  FOREIGN KEY (seller_id)  REFERENCES sellers(id),
    CONSTRAINT fk_offers_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ── Satıcı değerlendirmesi ────────────────────────────────────
-- Mevcut reviews tablosu oem_number anahtarlı (parçaya yorum) — pazaryerinde
-- yorum satıcıya yazılır. Yalnız kapanmış teklifi olan alıcı yorum yazabilir.
CREATE TABLE IF NOT EXISTS seller_reviews (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    seller_id   INT UNSIGNED NOT NULL,
    user_id     INT UNSIGNED NOT NULL,
    offer_id    BIGINT UNSIGNED NOT NULL,
    rating      TINYINT UNSIGNED NOT NULL,
    comment     VARCHAR(1000) DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_review_per_offer (offer_id),
    KEY idx_reviews_seller (seller_id, created_at),
    CONSTRAINT fk_reviews_seller FOREIGN KEY (seller_id) REFERENCES sellers(id),
    CONSTRAINT fk_reviews_offer  FOREIGN KEY (offer_id)  REFERENCES offers(id) ON DELETE CASCADE,
    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;
