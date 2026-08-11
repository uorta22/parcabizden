-- ════════════════════════════════════════════════════════════════════
--  Migration 05 — kategori: TecDoc FK yerine sabit slug
-- ════════════════════════════════════════════════════════════════════
--
--  listings.category_id ve request_items.category_id, catalog_categories
--  (27.185 satır) tablosuna işaret ediyordu. O listeyi araç bazlı süzmek
--  için catalog_part_vehicles (7,9 GiB) okunuyordu — yani 7,9 GiB'lık
--  tabloyu sırf ilan formundaki bir açılır liste için tutuyorduk.
--
--  Artık kategori uygulamada sabit: src/lib/part-categories.ts.
--  Slug'lar orada tanımlı; bu kolon o slug'ları saklıyor.
--
--  listings ve request_items şu an boş, o yüzden veri taşıma yok.
--  phpMyAdmin → SQL sekmesi → aşağıdaki bloğun TAMAMINI yapıştır.
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE listings
    DROP INDEX idx_listings_browse,
    DROP COLUMN category_id,
    ADD COLUMN category_slug VARCHAR(48) DEFAULT NULL AFTER year_to,
    ADD INDEX idx_listings_browse (status, expires_at, manufacturer_id, model_id, category_slug);

ALTER TABLE request_items
    DROP INDEX idx_request_items_match,
    DROP COLUMN category_id,
    ADD COLUMN category_slug VARCHAR(48) DEFAULT NULL AFTER request_id,
    ADD INDEX idx_request_items_match (category_slug, status);

-- Doğrulama: iki tabloda da category_slug görünmeli, category_id görünmemeli.
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('listings', 'request_items')
  AND COLUMN_NAME LIKE 'category%';
