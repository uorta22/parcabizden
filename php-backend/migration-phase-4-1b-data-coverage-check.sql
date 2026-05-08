-- ════════════════════════════════════════════════════════════
-- Faz 4.1b — `parts` vs `catalog_parts` Veri Kapsama Analizi
-- ════════════════════════════════════════════════════════════
-- Amaç: parts (7zap) tablosunda, catalog_parts (TecDoc) tablosunda
-- BULUNMAYAN OEM numarası var mı? Varsa kaç tane?
--
-- Eğer overlap >%99 ise parts table'ı silmek güvenli.
-- Eğer önemli sayıda eksik OEM varsa, önce o OEM'leri TecDoc'a
-- (veya bir 'unique_legacy_parts' tablosuna) taşımamız gerekir.
--
-- KULLANIM: phpMyAdmin → SQL sekmesi → her bloğu AYRI çalıştır.
-- Bazıları büyük tabloyu taradığı için 30-60 saniye sürebilir.
-- ════════════════════════════════════════════════════════════

-- ── A) parts'taki distinct OEM sayısı ──────────────────────
-- Beklenti: ~birkaç milyon (16.9M ham satırın denormalizasyonu kadar)
SELECT COUNT(DISTINCT oem_number) AS parts_unique_oem FROM parts;

-- ── B) catalog_parts'taki distinct part_number sayısı ──────
SELECT COUNT(DISTINCT part_number) AS catalog_unique_oem FROM catalog_parts;

-- ── C) parts'ta var, catalog_parts'ta YOK olan OEM sayısı ──
-- COLLATE şart: parts utf8mb4_general_ci, catalog_parts utf8mb4_turkish_ci.
-- Bu sorgu ASIL CEVAP — kaç parça kaybedersek?
SELECT COUNT(DISTINCT p.oem_number) AS missing_in_tecdoc
FROM parts p
LEFT JOIN catalog_parts c
       ON c.part_number = p.oem_number COLLATE utf8mb4_unicode_ci
WHERE c.id IS NULL;

-- ── D) Eğer (C) > 0 ise — örnek 20 eksik OEM ───────────────
-- Hangi parçalar kaybolacak görmek için.
SELECT DISTINCT p.oem_number, p.name, p.brand_slug, p.generation_slug
FROM parts p
LEFT JOIN catalog_parts c
       ON c.part_number = p.oem_number COLLATE utf8mb4_unicode_ci
WHERE c.id IS NULL
LIMIT 20;

-- ── E) Tedarikçi (supplier) kapsama kıyaslaması ────────────
-- parts tablosunda supplier alanı YOK. catalog ise tedarikçi başına ayrı kayıt:
-- aynı OEM, farklı tedarikçi → catalog'da daha fazla varyant.
SELECT
  (SELECT COUNT(DISTINCT oem_number) FROM parts)        AS parts_oem_distinct,
  (SELECT COUNT(*) FROM catalog_parts)                  AS catalog_total_supplier_part,
  (SELECT COUNT(DISTINCT part_number) FROM catalog_parts) AS catalog_distinct_oem,
  (SELECT COUNT(*) FROM catalog_suppliers)              AS catalog_supplier_count;

-- ── F) Cross-reference kapsama (parts'ta hiç yok) ──────────
-- Sadece bilgi amaçlı — TecDoc'un parts'a göre artısı.
SELECT COUNT(*) AS catalog_cross_ref_total FROM catalog_cross_ref;

-- ── YORUM ────────────────────────────────────────────────
-- (C) sonucuna göre:
--   = 0           → parts table %100 kapsanıyor, GÜVENLE silinir.
--   < %1 (örn. <10K) → çoğunluk kapsanıyor; eksikler büyük olasılıkla
--                       7zap'ın yanlış scrape ettiği gürültü. Gözden
--                       geçirip silmek mantıklı.
--   > %1          → ciddi kapsama eksikliği. Eksik OEM'leri ayrı bir
--                    tabloda saklamayı düşün, sonra parts'ı sil.
