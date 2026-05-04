-- ============================================
-- TecDoc Catalog Performans İndeksleri
-- ============================================
-- catalog_part_vehicles 78M satır — PK (part_id, vehicle_id, category_id)
-- olduğundan vehicle_id üzerinden sorgular index'siz çalışır.
-- Bu migration ID-bazlı yeni endpoint'ler için kritik index'leri ekler.
--
-- phpMyAdmin SQL sekmesinden çalıştırın. Idempotent (IF NOT EXISTS yok ama
-- tekrar çalıştırma DUPLICATE KEY NAME hatası dışında zarar vermez).
-- ============================================

SET NAMES utf8mb4;

-- catalog_part_vehicles: vehicle_id bazlı kategori ve parça sorguları için
-- (vehicle_id, category_id) ile (vehicle_id, part_id) arası seçim:
-- vehicle_id + category_id daha sık kullanılan kombinasyon (parts query)
ALTER TABLE catalog_part_vehicles
    ADD INDEX idx_vehicle_category (vehicle_id, category_id);

-- Reverse lookup: parça hangi araçlara uyuyor (part detail sayfası)
ALTER TABLE catalog_part_vehicles
    ADD INDEX idx_vehicle_lookup (vehicle_id);

-- catalog_vehicles: model_id zaten indexli (idx_model)
-- catalog_models: manufacturer_id zaten indexli (idx_manufacturer)
-- catalog_part_images: (supplier_id, part_number) zaten indexli (idx_supplier_part)
-- catalog_cross_ref: (supplier_id, part_number) zaten indexli (idx_part)

-- Ek: catalog_vehicle_engines için engine bazlı reverse lookup
-- (zaten idx_engine var; yeterli)

-- Ek: catalog_vehicle_attributes vehicle_id için zaten indexli (idx_vehicle)

-- Doğrulama sorgusu (manual):
-- SHOW INDEX FROM catalog_part_vehicles;
