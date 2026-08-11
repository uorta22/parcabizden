-- ════════════════════════════════════════════════════════════════════
--  Migration 06 — parça kataloglarını düşür  (~21 GiB → ~250 MiB)
-- ════════════════════════════════════════════════════════════════════
--
--  ÖNCE OKU:
--
--  Bu dosya GERİ ALINAMAZ. Çalıştırmadan önce şu ikisi tamamlanmış olmalı:
--    1. migration-marketplace-05-category-slug.sql çalıştırıldı
--    2. PHP deploy'u yayında (silinen modüller sunucudan da gitti)
--
--  Sırayı bozarsan site 500 döner: kod hâlâ olmayan tabloyu sorgular.
--
--  ── Ne gidiyor ───────────────────────────────────────────────────
--
--  A) Legacy 7zap kataloğu (~11,1 GiB) — catalog.php ile birlikte gitti
--  B) TecDoc parça katmanı (~10,0 GiB) — parça listeleme/arama kaldırıldı
--  C) Storefront kalıntıları (~1 MiB) — sepet/sipariş yüzeyi zaten yoktu
--
--  ── Ne KALIYOR ───────────────────────────────────────────────────
--
--  catalog_manufacturers, catalog_models, catalog_vehicles,
--  catalog_engines, catalog_vehicle_engines, catalog_vehicle_attributes
--    → marka/model/varyant seçicisi. Talep formu, ilan formu, ilan
--      filtresi ve garaj bunlara bağlı. Toplam ~210 MiB. DOKUNMA.
--
--  ── Nasıl çalıştırılır ───────────────────────────────────────────
--
--  phpMyAdmin → veritabanını seç → SQL sekmesi → bu satırdan aşağısını
--  komple yapıştır → Git. Yorum satırlarını ayıklamana gerek yok.
--  Büyük tablolarda DROP birkaç dakika sürebilir, sayfayı kapatma.
-- ════════════════════════════════════════════════════════════════════

-- ── A) Legacy 7zap kataloğu ──────────────────────────────────────────
DROP TABLE IF EXISTS parts;                    -- ~16,9M satır · 10,9 GiB
DROP TABLE IF EXISTS part_images;              -- ~669k satır  · 121 MiB
DROP TABLE IF EXISTS node_categories;          -- ~93k satır   ·  30 MiB
DROP TABLE IF EXISTS parts_gen_summary;
DROP TABLE IF EXISTS parts_brand_summary;
DROP TABLE IF EXISTS legacy_unique_parts;
DROP TABLE IF EXISTS vin_patterns;             -- vin_decode kaldırıldı
DROP TABLE IF EXISTS vehicle_specs;            -- autodata.php kaldırıldı
DROP TABLE IF EXISTS migration_7zap_brand_map;
DROP TABLE IF EXISTS migration_7zap_cat_map;

-- ── B) TecDoc parça katmanı ──────────────────────────────────────────
DROP TABLE IF EXISTS catalog_part_vehicles;    -- ~82,2M satır · 7,9 GiB
DROP TABLE IF EXISTS catalog_part_images;      -- ~5,1M satır  · 666 MiB
DROP TABLE IF EXISTS catalog_cross_ref;        -- ~300k satır  · 105 MiB
DROP TABLE IF EXISTS catalog_parts;            -- ~8,4M satır  · 1,3 GiB
DROP TABLE IF EXISTS catalog_categories;       -- kategori artık sabit taksonomi
DROP TABLE IF EXISTS catalog_suppliers;

-- ── C) Storefront kalıntıları ────────────────────────────────────────
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS reviews;                  -- ürün yorumu; satıcı puanı seller_reviews'te
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;

-- ── Doğrulama ────────────────────────────────────────────────────────
-- information_schema KULLANMA — cPanel'in kısıtlı MySQL kullanıcısı o şemayı
-- okuyamıyor, sorgu #1044 Access denied ile düşer ve DROP'lar çalışmış olsa
-- bile ekranda hata görürsün. SHOW aynı bilgiyi yetki istemeden veriyor.
--
-- Beklenen: liste ~25 tablo, en büyükleri catalog_vehicle_attributes (~193M)
-- ve catalog_models (~2,6M). parts / catalog_parts / catalog_part_vehicles /
-- orders / products görünmemeli.
SHOW TABLE STATUS;
