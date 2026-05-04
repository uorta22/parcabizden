-- ============================================
-- TecDoc Catalog Performans İndeksleri (idempotent + online)
-- ============================================
-- catalog_part_vehicles 78M satır.
-- ALGORITHM=INPLACE, LOCK=NONE ile online ekleme yapılır
-- (tablo kilitlenmez, ama hâlâ uzun sürebilir; phpMyAdmin'de
-- PHP timeout aşarsa "Migrations" bölümünden veya CLI'dan çalıştır).
--
-- Idempotent: stored procedure ile mevcut index varsa atlar.
-- ============================================

SET NAMES utf8mb4;

DELIMITER $$

DROP PROCEDURE IF EXISTS pb_add_index_if_missing $$
CREATE PROCEDURE pb_add_index_if_missing(
    IN p_table   VARCHAR(64),
    IN p_index   VARCHAR(64),
    IN p_columns VARCHAR(255)
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    SELECT COUNT(*) INTO v_count
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = p_table
      AND INDEX_NAME   = p_index;

    IF v_count = 0 THEN
        SET @sql = CONCAT(
            'ALTER TABLE `', p_table, '`',
            ' ADD INDEX `', p_index, '` (', p_columns, ')',
            ', ALGORITHM=INPLACE, LOCK=NONE'
        );
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('OK: ', p_table, '.', p_index, ' eklendi') AS result;
    ELSE
        SELECT CONCAT('SKIP: ', p_table, '.', p_index, ' zaten var') AS result;
    END IF;
END $$

DELIMITER ;

-- 78M satırlık tabloda kategori sorguları için kritik
CALL pb_add_index_if_missing(
    'catalog_part_vehicles',
    'idx_vehicle_category',
    '`vehicle_id`, `category_id`'
);

-- Reverse lookup: parça → araçlar (part detail için)
CALL pb_add_index_if_missing(
    'catalog_part_vehicles',
    'idx_vehicle_lookup',
    '`vehicle_id`'
);

-- Temizlik
DROP PROCEDURE IF EXISTS pb_add_index_if_missing;

-- Doğrulama (manuel):
-- SHOW INDEX FROM catalog_part_vehicles;
