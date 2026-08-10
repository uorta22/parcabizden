-- ═══════════════════════════════════════════════════════════════
-- Pazaryeri — Faz 4: Hesap tipi ayrımı
-- ═══════════════════════════════════════════════════════════════
-- NEDEN:
--   Üç ayrı yüzey var (alıcı sitesi, pazaryeri paneli, talep alanı)
--   ve hesap sistemleri ayrı olmalı: alıcı hesabıyla satıcı paneline
--   girilememeli, tersi de geçerli.
--
--   Bu ayrım SUNUCUDA zorlanır. Frontend'in üç ayrı alan adında
--   olması bir güvenlik sınırı değildir — API ayrı hostta ve
--   doğrudan çağrılabilir. Kontrol auth.php'de yapılır.
--
--   Tip token'a yazılsa bile her istekte DB'den taze okunur
--   (requireAdmin ile aynı desen): rol değişince oturum beklemeden
--   erişim kapanır.
--
-- GERİYE DÖNÜK UYUMLULUK:
--   Mevcut kullanıcılar 'buyer' olur. Zaten mağaza başvurusu olan
--   kullanıcılar 'seller' işaretlenir ki panelden düşmesinler.
--
-- TEKRAR ÇALIŞTIRILABİLİR.
-- ═══════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'users'
      AND COLUMN_NAME  = 'account_type'
);

SET @ddl := IF(@col_exists = 0,
    "ALTER TABLE users ADD COLUMN account_type ENUM('buyer','seller') NOT NULL DEFAULT 'buyer' AFTER email",
    'SELECT "account_type kolonu zaten var" AS bilgi'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Mağaza başvurusu olan mevcut kullanıcılar satıcı sayılır.
UPDATE users u
   JOIN sellers s ON s.user_id = u.id
   SET u.account_type = 'seller'
 WHERE u.account_type <> 'seller';

SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'users'
      AND INDEX_NAME   = 'idx_users_account_type'
);

SET @ddl := IF(@idx_exists = 0,
    'ALTER TABLE users ADD KEY idx_users_account_type (account_type)',
    'SELECT "idx_users_account_type zaten var" AS bilgi'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
