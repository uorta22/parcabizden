-- Migration 05: listings/request_items kategorisi TecDoc FK yerine sabit slug.
-- Slug taksonomisi: src/lib/part-categories.ts
-- Iki tablo da bos, veri tasima yok.
-- NOT: Bu dosyada bilerek uzun yorum blogu yok. phpMyAdmin uzun --
-- bloklarini ilk komuta yapistirinca batch'i #1044 ile reddediyor.

ALTER TABLE listings DROP INDEX idx_listings_browse;
ALTER TABLE listings DROP COLUMN category_id;
ALTER TABLE listings ADD COLUMN category_slug VARCHAR(48) DEFAULT NULL AFTER year_to;
ALTER TABLE listings ADD INDEX idx_listings_browse (status, expires_at, manufacturer_id, model_id, category_slug);

ALTER TABLE request_items DROP INDEX idx_request_items_match;
ALTER TABLE request_items DROP COLUMN category_id;
ALTER TABLE request_items ADD COLUMN category_slug VARCHAR(48) DEFAULT NULL AFTER request_id;
ALTER TABLE request_items ADD INDEX idx_request_items_match (category_slug, status);

SHOW COLUMNS FROM listings LIKE 'category%';
SHOW COLUMNS FROM request_items LIKE 'category%';
