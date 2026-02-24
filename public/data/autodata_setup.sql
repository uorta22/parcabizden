-- Autodata entegrasyonu icin calistirilacak SQL'ler
-- Natro phpMyAdmin'de calistirin

-- 1. vehicle_specs tablosu (yoksa olustur)
CREATE TABLE IF NOT EXISTS vehicle_specs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    generation VARCHAR(200),
    modification VARCHAR(300),
    year_start SMALLINT,
    year_end SMALLINT,
    body_type VARCHAR(100),
    fuel_type VARCHAR(50),
    engine_cc INT,
    cylinders TINYINT,
    power_hp DECIMAL(6,1),
    torque_nm DECIMAL(6,1),
    transmission VARCHAR(200),
    drivetrain VARCHAR(100),
    top_speed_kmh DECIMAL(5,1),
    accel_0_100 DECIMAL(4,1),
    fuel_combined DECIMAL(4,1),
    co2_gkm DECIMAL(5,1),
    length_mm SMALLINT,
    width_mm SMALLINT,
    height_mm SMALLINT,
    wheelbase_mm SMALLINT,
    weight_kg DECIMAL(6,1),
    trunk_liters DECIMAL(6,1),
    fuel_tank_liters DECIMAL(5,1),
    seats TINYINT,
    doors TINYINT,
    source_url VARCHAR(500),
    INDEX idx_brand (brand),
    INDEX idx_brand_model (brand, model),
    INDEX idx_year (year_start),
    INDEX idx_fuel (fuel_type),
    INDEX idx_body (body_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- 2. garage tablosuna spec_id kolonu ekle
ALTER TABLE garage ADD COLUMN spec_id INT DEFAULT NULL;

-- 3. Slug eslestirme kopru tablosu
CREATE TABLE IF NOT EXISTS vehicle_slug_map (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_slug VARCHAR(50) NOT NULL,
    tree_slug VARCHAR(200),
    autodata_brand VARCHAR(50),
    autodata_model VARCHAR(100),
    autodata_generation VARCHAR(200),
    parts_gen_slug VARCHAR(200),
    INDEX idx_brand_tree (brand_slug, tree_slug),
    INDEX idx_brand_autodata (brand_slug, autodata_generation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;
