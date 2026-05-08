-- ════════════════════════════════════════════════════════════
-- Faz 4.1 — Ölü Migration Helper / Şema Kalıntı Tablolarını DROP
-- ════════════════════════════════════════════════════════════
-- Bu fazda silinen tablolar HİÇBİR aktif kod tarafından okunmuyor.
-- Hepsini DROP IF EXISTS ile yapıyoruz — yoksa hata vermeyecek.
--
-- Risk: 🟢 Düşük. Geri dönüş: yedekten restore.
-- Kazanım: ~14 MB + DB inventarından 11 ölü tablo eksilmesi.
--
-- KULLANIM: phpMyAdmin → SQL sekmesi → tüm dosyayı yapıştır → Go.
-- ════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- ── 7zap.com scrape migration helper'ları (~13.5 MB) ──────────
-- TecDoc geçişi tamamlandığı için bu tablolar artık anlamsız.
DROP TABLE IF EXISTS migration_7zap_brand_map;
DROP TABLE IF EXISTS migration_7zap_cat_map;
DROP TABLE IF EXISTS migration_7zap_gen_map;
DROP TABLE IF EXISTS migration_7zap_progress;

-- ── Eski TecDoc import günlüğü (latin1 collation, 35 satır) ──
DROP TABLE IF EXISTS import_log;

-- ── Boş şema kalıntıları (0 satır) ────────────────────────────
-- catalog_vehicles, catalog_models vs. zaten dolu, bunlar fosil.
DROP TABLE IF EXISTS vehicle_slug_map;
DROP TABLE IF EXISTS generations;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS modifications;

-- ── Eski araç tablosu (2.5K satır, catalog_vehicles 22K satır) ──
-- catalog_vehicles TecDoc kanonik veri kaynağı.
DROP TABLE IF EXISTS vehicles;

-- ── Doğrulama ────────────────────────────────────────────────
-- Çalıştırdıktan sonra bu sorgu ile kalan tablo sayısını kontrol edin:
-- SELECT COUNT(*) AS remaining_tables FROM information_schema.TABLES
-- WHERE TABLE_SCHEMA = DATABASE();
-- (43 → 32 olmalı.)
