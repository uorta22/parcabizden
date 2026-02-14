-- ParcaBizden Database Schema
-- Collation: utf8mb4_turkish_ci (Türkçe sıralama desteği)
-- Engine: InnoDB

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================
-- BRANDS
-- ============================================
CREATE TABLE IF NOT EXISTS brands (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo_file VARCHAR(255) DEFAULT NULL,
    is_popular TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_popular (is_popular),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- MODELS
-- ============================================
CREATE TABLE IF NOT EXISTS models (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    brand_id INT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_brand_id (brand_id),
    INDEX idx_name (name),
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- SEGMENTS (Alt Segment / Kasa Tipi)
-- ============================================
CREATE TABLE IF NOT EXISTS segments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    model_id INT UNSIGNED NOT NULL,
    name VARCHAR(200) NOT NULL,
    year_start SMALLINT UNSIGNED NOT NULL,
    year_end SMALLINT UNSIGNED NOT NULL,
    body_type VARCHAR(50) DEFAULT NULL COMMENT 'Sedan, Hatchback, SUV, etc.',
    engine_type VARCHAR(100) DEFAULT NULL COMMENT '1.6 TDI, 2.0 TSI, etc.',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_model_id (model_id),
    INDEX idx_years (year_start, year_end),
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    icon VARCHAR(50) DEFAULT NULL,
    sort_order TINYINT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- PARTS
-- ============================================
CREATE TABLE IF NOT EXISTS parts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    oem_number VARCHAR(100) DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    part_type ENUM('yedek', 'cikma', 'both') DEFAULT 'both',
    position VARCHAR(50) DEFAULT NULL COMMENT 'ön, arka, sağ, sol, etc.',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_id (category_id),
    INDEX idx_oem_number (oem_number),
    FULLTEXT idx_fulltext_search (name, description),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- PART COMPATIBILITY (Parça-Segment Uyumluluk)
-- ============================================
CREATE TABLE IF NOT EXISTS part_compatibility (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    part_id INT UNSIGNED NOT NULL,
    segment_id INT UNSIGNED NOT NULL,
    year_start SMALLINT UNSIGNED DEFAULT NULL,
    year_end SMALLINT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_part_id (part_id),
    INDEX idx_segment_id (segment_id),
    INDEX idx_part_segment (part_id, segment_id),
    FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- USER VEHICLES (Garaj)
-- ============================================
CREATE TABLE IF NOT EXISTS user_vehicles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    brand_id INT UNSIGNED NOT NULL,
    model_id INT UNSIGNED NOT NULL,
    segment_id INT UNSIGNED DEFAULT NULL,
    year SMALLINT UNSIGNED NOT NULL,
    nickname VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================
-- SEED DATA: Categories
-- ============================================
INSERT INTO categories (slug, name, description, icon, sort_order) VALUES
('motor', 'Motor Parçaları', 'Motor bloğu, silindir kapağı, piston, supap, krank mili ve tüm motor iç parçaları', 'Settings', 1),
('sanziman', 'Şanzıman Parçaları', 'Manuel ve otomatik şanzıman, diferansiyel, şanzıman iç parçaları, kavrama seti', 'Settings', 2),
('suspansiyon', 'Süspansiyon Parçaları', 'Amortisör, rotil, rot kolu, salıncak, bilyalı yatak, viraj demiri', 'Car', 3),
('fren', 'Fren Sistemi', 'Fren diski, fren balatası, fren kaliperi, ABS sensörü, fren hortumu', 'Disc', 4),
('kaporta', 'Kaporta Parçaları', 'Kaput, bagaj, çamurluk, kapı, tampon, panjur, ayna', 'Car', 5),
('aydinlatma', 'Aydınlatma', 'Far, stop lambası, sinyal, sis farı, xenon, LED aydınlatma', 'Lightbulb', 6),
('elektrik', 'Elektrik Aksamı', 'Alternatör, marş motoru, akü, sigorta kutusu, kablo tesisatı', 'Battery', 7),
('sogutma', 'Soğutma Sistemi', 'Radyatör, su pompası, termostat, radyatör hortumu, fan motoru', 'Thermometer', 8),
('egzoz', 'Egzoz Sistemi', 'Egzoz manifoldu, katalitik konvertör, egzoz borusu, susturucu', 'Wind', 9),
('direksiyon', 'Direksiyon Sistemi', 'Direksiyon kutusu, direksiyon pompası, rot, rotil, kremayer', 'Wrench', 10),
('ic-aksesuar', 'İç Aksesuar', 'Gösterge paneli, koltuk, konsol, kalorifer, klima ünitesi', 'Layout', 11),
('cam', 'Cam ve Ayna', 'Ön cam, arka cam, yan cam, dikiz aynası, yan ayna', 'Square', 12);

-- ============================================
-- SEED DATA: Popular Brands
-- ============================================
INSERT INTO brands (name, logo_file, is_popular) VALUES
('Volkswagen', 'volkswagen.png', 1),
('BMW', 'bmw.png', 1),
('Mercedes-Benz', 'mercedes-benz.png', 1),
('Audi', 'audi.png', 1),
('Toyota', 'toyota.png', 1),
('Ford', 'ford.png', 1),
('Renault', 'renault.png', 1),
('Fiat', 'fiat.png', 1),
('Hyundai', 'hyundai.png', 1),
('Kia', 'kia.png', 1),
('Peugeot', 'peugeot.png', 1),
('Opel', 'opel.png', 1),
('Honda', 'honda.png', 1),
('Nissan', 'nissan.png', 1),
('Skoda', 'skoda.png', 1),
('Mazda', 'mazda.png', 1),
('Citroen', 'citroen.png', 1),
('Volvo', 'volvo.png', 1),
('Seat', 'seat.png', 1),
('Dacia', 'dacia.png', 1),
('Mitsubishi', 'mitsubishi.png', 1),
('Subaru', 'subaru.png', 1),
('Suzuki', 'suzuki.png', 1),
('Chevrolet', 'chevrolet.png', 1);

-- ============================================
-- BigDump Import Helper (for 6GB dumps)
-- Place bigdump.php in api/ folder, configure DB credentials
-- Access via browser: https://parcabizden.com.tr/api/bigdump.php
-- ============================================
