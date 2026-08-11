-- Migration 06: parca kataloglarini dusur. ~21 GiB -> ~250 MiB. GERI ALINAMAZ.
-- Onkosul: migration 05 calisti ve PHP deploy yayinda.
-- KALAN araç tablolarina DOKUNULMUYOR: catalog_manufacturers, catalog_models,
-- catalog_vehicles, catalog_engines, catalog_vehicle_engines,
-- catalog_vehicle_attributes. Marka/model/varyant secicisi bunlara bagli.
-- NOT: Uzun yorum blogu yok; phpMyAdmin onlari ilk komuta yapistirip
-- batch'i #1044 ile reddediyor.

DROP TABLE IF EXISTS parts;
DROP TABLE IF EXISTS part_images;
DROP TABLE IF EXISTS node_categories;
DROP TABLE IF EXISTS parts_gen_summary;
DROP TABLE IF EXISTS parts_brand_summary;
DROP TABLE IF EXISTS legacy_unique_parts;
DROP TABLE IF EXISTS vin_patterns;
DROP TABLE IF EXISTS vehicle_specs;
DROP TABLE IF EXISTS migration_7zap_brand_map;
DROP TABLE IF EXISTS migration_7zap_cat_map;

DROP TABLE IF EXISTS catalog_part_vehicles;
DROP TABLE IF EXISTS catalog_part_images;
DROP TABLE IF EXISTS catalog_cross_ref;
DROP TABLE IF EXISTS catalog_parts;
DROP TABLE IF EXISTS catalog_categories;
DROP TABLE IF EXISTS catalog_suppliers;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;

SHOW TABLES;
