-- ============================================
-- TecDoc Catalog Performans İndeksleri (basit & shared-hosting safe)
-- ============================================
-- catalog_part_vehicles 78M satır. vehicle_id bazlı sorgular için
-- composite index ŞART (yoksa table scan).
--
-- ALGORITHM=INPLACE, LOCK=NONE → online (tablo kilitlenmez,
-- diğer sorgular paralel çalışmaya devam eder).
--
-- KULLANIM:
--   phpMyAdmin → SQL sekmesi → her ALTER TABLE'ı AYRI çalıştır.
--   "Duplicate key name 'xxx'" hatası alırsan → zaten kurulu, atla.
-- ============================================

SET NAMES utf8mb4;

-- 1) Kategori sorguları için kritik composite index
ALTER TABLE catalog_part_vehicles
    ADD INDEX idx_vehicle_category (vehicle_id, category_id),
    ALGORITHM=INPLACE, LOCK=NONE;

-- 2) Reverse lookup (parça → araçlar)
ALTER TABLE catalog_part_vehicles
    ADD INDEX idx_vehicle_lookup (vehicle_id),
    ALGORITHM=INPLACE, LOCK=NONE;

-- ────────────────────────────────────────────
-- Doğrulama:
-- SHOW INDEX FROM catalog_part_vehicles;
--
-- Listede şu iki satır görünmeli:
--   idx_vehicle_category  (vehicle_id, category_id)
--   idx_vehicle_lookup    (vehicle_id)
-- ────────────────────────────────────────────
