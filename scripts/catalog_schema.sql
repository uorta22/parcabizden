-- ParcaBizden Katalog Veritabanı Şeması (parcabizden_v3.db → MySQL)
-- Collation: utf8mb4_turkish_ci
-- Engine: InnoDB
-- Kullanım: phpMyAdmin SQL sekmesinden çalıştırın

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- MANUFACTURERS (Üreticiler/Markalar)
-- 457 satır
-- ============================================
CREATE TABLE IF NOT EXISTS catalog_manufacturers (
    id INT UNSIGNED NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    matchcode VARCHAR(100) DEFAULT NULL,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- MODELS (Modeller)
-- 13.137 satır
-- ============================================
CREATE TABLE IF NOT EXISTS catalog_models (
    id INT UNSIGNED NOT NULL PRIMARY KEY,
    manufacturer_id INT UNSIGNED NOT NULL,
    name VARCHAR(200) NOT NULL,
    full_name VARCHAR(500) DEFAULT NULL,
    year_range VARCHAR(50) DEFAULT NULL,
    INDEX idx_manufacturer (manufacturer_id),
    INDEX idx_name (name),
    FOREIGN KEY (manufacturer_id) REFERENCES catalog_manufacturers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- VEHICLES (Araçlar — KType bazlı)
-- 27.125 satır
-- ============================================
CREATE TABLE IF NOT EXISTS catalog_vehicles (
    id INT UNSIGNED NOT NULL PRIMARY KEY,
    model_id INT UNSIGNED NOT NULL,
    description VARCHAR(500) DEFAULT NULL,
    full_name VARCHAR(500) DEFAULT NULL,
    year_from SMALLINT UNSIGNED DEFAULT NULL,
    year_to SMALLINT UNSIGNED DEFAULT NULL,
    can_be_displayed TINYINT(1) NOT NULL DEFAULT 1,
    INDEX idx_model (model_id),
    INDEX idx_year (year_from, year_to),
    FOREIGN KEY (model_id) REFERENCES catalog_models(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- CATEGORIES (Parça Kategorileri)
-- 27.185 satır
-- ============================================
CREATE TABLE IF NOT EXISTS catalog_categories (
    id INT UNSIGNED NOT NULL PRIMARY KEY,
    assembly_group_en VARCHAR(300) DEFAULT NULL,
    description_en VARCHAR(500) DEFAULT NULL,
    normalized_en VARCHAR(500) DEFAULT NULL,
    usage_en VARCHAR(500) DEFAULT NULL,
    assembly_group_tr VARCHAR(300) DEFAULT NULL,
    description_tr VARCHAR(500) DEFAULT NULL,
    normalized_tr VARCHAR(500) DEFAULT NULL,
    usage_tr VARCHAR(500) DEFAULT NULL,
    INDEX idx_desc_tr (description_tr(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- SUPPLIERS (Tedarikçiler)
-- 662 satır
-- ============================================
CREATE TABLE IF NOT EXISTS catalog_suppliers (
    id INT UNSIGNED NOT NULL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    matchcode VARCHAR(100) DEFAULT NULL,
    article_count INT UNSIGNED DEFAULT NULL,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- ENGINES (Motorlar)
-- 25.206 satır
-- ============================================
CREATE TABLE IF NOT EXISTS catalog_engines (
    id INT UNSIGNED NOT NULL PRIMARY KEY,
    code VARCHAR(100) DEFAULT NULL,
    description VARCHAR(500) DEFAULT NULL,
    full_name VARCHAR(500) DEFAULT NULL,
    year_range VARCHAR(50) DEFAULT NULL,
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- VEHICLE_ENGINES (Araç-Motor İlişkisi)
-- 62.121 satır
-- ============================================
CREATE TABLE IF NOT EXISTS catalog_vehicle_engines (
    vehicle_id INT UNSIGNED NOT NULL,
    engine_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (vehicle_id, engine_id),
    INDEX idx_engine (engine_id),
    FOREIGN KEY (vehicle_id) REFERENCES catalog_vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (engine_id) REFERENCES catalog_engines(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- VEHICLE_ATTRIBUTES (Araç Özellikleri)
-- 1.724.286 satır
-- ============================================
CREATE TABLE IF NOT EXISTS catalog_vehicle_attributes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT UNSIGNED NOT NULL,
    attribute_group VARCHAR(200) DEFAULT NULL,
    attribute_type VARCHAR(200) DEFAULT NULL,
    display_title VARCHAR(300) DEFAULT NULL,
    display_value VARCHAR(500) DEFAULT NULL,
    INDEX idx_vehicle (vehicle_id),
    FOREIGN KEY (vehicle_id) REFERENCES catalog_vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- PARTS (Parçalar)
-- 3.920.229 satır
-- ============================================
CREATE TABLE IF NOT EXISTS catalog_parts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT UNSIGNED NOT NULL,
    part_number VARCHAR(100) NOT NULL,
    UNIQUE KEY uk_supplier_part (supplier_id, part_number),
    INDEX idx_supplier (supplier_id),
    INDEX idx_part_number (part_number),
    FOREIGN KEY (supplier_id) REFERENCES catalog_suppliers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- PART_VEHICLES (Parça-Araç-Kategori İlişkisi)
-- 78.718.888 satır — EN BÜYÜK TABLO
-- Index'ler import sonrası oluşturulacak (performans için)
-- ============================================
CREATE TABLE IF NOT EXISTS catalog_part_vehicles (
    part_id INT UNSIGNED NOT NULL,
    vehicle_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (part_id, vehicle_id, category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- PART_IMAGES (Parça Görselleri)
-- 5.352.630 satır
-- ============================================
CREATE TABLE IF NOT EXISTS catalog_part_images (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT UNSIGNED DEFAULT NULL,
    part_number VARCHAR(100) DEFAULT NULL,
    picture_name VARCHAR(500) DEFAULT NULL,
    doc_type VARCHAR(50) DEFAULT 'Picture',
    UNIQUE KEY uk_image (supplier_id, part_number, picture_name(200)),
    INDEX idx_supplier_part (supplier_id, part_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- CROSS_REF (Muadil/Alternatif Parça Referansları)
-- 334.152 satır
-- ============================================
CREATE TABLE IF NOT EXISTS catalog_cross_ref (
    supplier_id INT UNSIGNED NOT NULL,
    part_number VARCHAR(100) NOT NULL,
    ref_supplier_id INT UNSIGNED NOT NULL,
    ref_part_number VARCHAR(100) NOT NULL,
    ref_type VARCHAR(50) NOT NULL DEFAULT 'replacement',
    PRIMARY KEY (supplier_id, part_number, ref_supplier_id, ref_part_number, ref_type),
    INDEX idx_part (supplier_id, part_number),
    INDEX idx_ref (ref_supplier_id, ref_part_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- PART_VEHICLES INDEX'LERİ (import sonrası çalıştır)
-- Ayrı dosya olarak: catalog_indexes.sql
-- ============================================
-- ALTER TABLE catalog_part_vehicles ADD INDEX idx_vehicle (vehicle_id);
-- ALTER TABLE catalog_part_vehicles ADD INDEX idx_part (part_id);
-- ALTER TABLE catalog_part_vehicles ADD INDEX idx_category (category_id);
