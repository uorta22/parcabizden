-- ============================================
-- TecDoc Catalog Performans İndeksleri
-- ============================================
-- catalog_part_vehicles 78M satır — vehicle_id bazlı sorgular için
-- composite index ŞART (yoksa table scan).
--
-- Shared hosting uyumlu: stored procedure YOK, sadece dynamic SQL.
-- Idempotent: index zaten varsa atlar, yoksa ekler.
-- Online: ALGORITHM=INPLACE, LOCK=NONE — tablo kilitlenmez.
--
-- phpMyAdmin → SQL sekmesi → tüm dosyayı yapıştır → Go.
-- ============================================

SET NAMES utf8mb4;

-- ────────────────────────────────────────────
-- 1) idx_vehicle_category (vehicle_id, category_id)
--    Kategori sorguları için kritik.
-- ────────────────────────────────────────────
SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'catalog_part_vehicles'
      AND INDEX_NAME   = 'idx_vehicle_category'
);

SET @sql := IF(@idx_exists = 0,
    'ALTER TABLE catalog_part_vehicles
        ADD INDEX idx_vehicle_category (vehicle_id, category_id),
        ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "SKIP: idx_vehicle_category zaten var" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ────────────────────────────────────────────
-- 2) idx_vehicle_lookup (vehicle_id)
--    Reverse lookup: parça → araçlar (part detail için).
-- ────────────────────────────────────────────
SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'catalog_part_vehicles'
      AND INDEX_NAME   = 'idx_vehicle_lookup'
);

SET @sql := IF(@idx_exists = 0,
    'ALTER TABLE catalog_part_vehicles
        ADD INDEX idx_vehicle_lookup (vehicle_id),
        ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT "SKIP: idx_vehicle_lookup zaten var" AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ────────────────────────────────────────────
-- Doğrulama (manuel — bu satırı ayrıca çalıştır):
-- SHOW INDEX FROM catalog_part_vehicles;
-- ────────────────────────────────────────────
