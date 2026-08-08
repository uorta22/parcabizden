-- ═══════════════════════════════════════════════════════════════
-- Pazaryeri — Faz 3: Misafir talebi erişim anahtarı
-- ═══════════════════════════════════════════════════════════════
-- NEDEN:
--   Talep üyeliksiz açılabiliyor (otodevi giriş + adres + TC Kimlik
--   istiyor; 1247 satıcıya karşı 500 tamamlanan talep, sürtünme
--   tam olarak orada). Ama misafir daha sonra tekliflerini görmek
--   için geri dönebilmeli.
--
--   Talebi yalnızca id ile açtırmak numara denemeye (enumeration)
--   açık olurdu — başkasının telefonu ve talebi okunabilirdi.
--   Bu yüzden her talebe tahmin edilemez bir erişim anahtarı
--   veriyoruz; misafire gönderilen link bunu taşır.
--
-- TEKRAR ÇALIŞTIRILABİLİR: kolon zaten varsa hata vermeden geçer.
-- ═══════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- MySQL'de "ADD COLUMN IF NOT EXISTS" her sürümde yok; information_schema
-- üzerinden kontrol edip dinamik SQL ile ekliyoruz.
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'requests'
      AND COLUMN_NAME  = 'access_token'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE requests ADD COLUMN access_token CHAR(48) DEFAULT NULL AFTER contact_phone',
    'SELECT "access_token kolonu zaten var" AS bilgi'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'requests'
      AND INDEX_NAME   = 'uq_requests_token'
);

SET @ddl := IF(@idx_exists = 0,
    'ALTER TABLE requests ADD UNIQUE KEY uq_requests_token (access_token)',
    'SELECT "uq_requests_token zaten var" AS bilgi'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
