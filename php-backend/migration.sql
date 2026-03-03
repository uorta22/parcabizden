-- ParcaBizden E-Commerce Migration
-- Run this file once on your MySQL database via phpMyAdmin or SSH.
-- Safe to re-run: all CREATE TABLE statements use IF NOT EXISTS.
-- ---------------------------------------------------------------

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ---------------------------------------------------------------
-- products
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  slug             VARCHAR(255) NOT NULL UNIQUE,
  oem_number       VARCHAR(100) DEFAULT NULL,
  brand_name       VARCHAR(100) DEFAULT NULL,
  brand_logo       VARCHAR(255) DEFAULT NULL,
  category         VARCHAR(50)  NOT NULL,
  price            DECIMAL(10,2) DEFAULT NULL,
  discount_price   DECIMAL(10,2) DEFAULT NULL,
  images           JSON          DEFAULT NULL,
  thumbnail        VARCHAR(255)  DEFAULT NULL,
  specs            JSON          DEFAULT NULL,
  description      TEXT          DEFAULT NULL,
  compatible_vehicles JSON       DEFAULT NULL,
  in_stock         TINYINT(1)   DEFAULT 1,
  is_consumable    TINYINT(1)   DEFAULT 0,
  tags             JSON          DEFAULT NULL,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category  (category),
  INDEX idx_slug      (slug),
  INDEX idx_oem       (oem_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  order_no    VARCHAR(20) NOT NULL UNIQUE,
  status      ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
  total_price DECIMAL(10,2) DEFAULT 0,
  address_id  INT           DEFAULT NULL,
  notes       TEXT          DEFAULT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user   (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT NOT NULL,
  product_id    INT DEFAULT NULL,
  product_name  VARCHAR(255) NOT NULL,
  product_image VARCHAR(255) DEFAULT NULL,
  quantity      INT         DEFAULT 1,
  unit_price    DECIMAL(10,2) DEFAULT 0,
  has_price     TINYINT(1)  DEFAULT 1,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  title         VARCHAR(50)  NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255) DEFAULT NULL,
  city          VARCHAR(50)  NOT NULL,
  district      VARCHAR(50)  NOT NULL,
  postal_code   VARCHAR(10)  NOT NULL,
  is_default    TINYINT(1)   DEFAULT 0,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_product (user_id, product_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- users table — extended profile columns (ALTER IF NOT EXISTS)
-- MySQL 8.0+: ADD COLUMN IF NOT EXISTS is supported.
-- For MySQL 5.7 the procedure below handles it safely.
-- ---------------------------------------------------------------

DROP PROCEDURE IF EXISTS _pb_add_column;

DELIMITER $$
CREATE PROCEDURE _pb_add_column(
    IN tbl VARCHAR(64),
    IN col VARCHAR(64),
    IN col_def VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = tbl
          AND COLUMN_NAME  = col
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', col_def);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

CALL _pb_add_column('users', 'gsm',          'VARCHAR(20)  DEFAULT NULL');
CALL _pb_add_column('users', 'address_line1', 'VARCHAR(255) DEFAULT NULL');
CALL _pb_add_column('users', 'address_line2', 'VARCHAR(255) DEFAULT NULL');
CALL _pb_add_column('users', 'city',          'VARCHAR(50)  DEFAULT NULL');
CALL _pb_add_column('users', 'district',      'VARCHAR(50)  DEFAULT NULL');
CALL _pb_add_column('users', 'postal_code',   'VARCHAR(10)  DEFAULT NULL');
CALL _pb_add_column('users', 'tc_no',         'VARCHAR(11)  DEFAULT NULL');
CALL _pb_add_column('users', 'deleted_at',    'TIMESTAMP    DEFAULT NULL');

DROP PROCEDURE IF EXISTS _pb_add_column;
