-- ════════════════════════════════════════════════════════════
-- Faz 4.2 — Legacy Unique Parts Bridge Migration
-- ════════════════════════════════════════════════════════════
-- Coverage check'lerinde TecDoc'un parts'ı %99.998 kapsadığını
-- gördük. Yine de kayıpsız geçiş için, parts'ta var ama
-- catalog_parts'ta YOK olan OEM'leri küçük bir bridge tablosuna
-- taşıyoruz. Sonra parts DROP edilebilir.
--
-- Bridge tablosu yaklaşık 80-200 satır olacak (ekstrapolasyon),
-- birkaç KB. Risk: yok. Geri dönüş: tabloyu DROP.
--
-- KULLANIM: phpMyAdmin → SQL → her bloğu AYRI çalıştır.
-- ════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- ── BLOK 1 — Bridge tablosunu oluştur ─────────────────────
-- Schema TecDoc tarzı: oem_number anahtarı + 7zap'tan gelen ek metadata.
-- catalog_parts ile aynı collation (turkish_ci) — ileride JOIN için.
CREATE TABLE IF NOT EXISTS legacy_unique_parts (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    oem_number      VARCHAR(100) NOT NULL,
    name            VARCHAR(255) DEFAULT NULL,
    brand_slug      VARCHAR(100) DEFAULT NULL,
    generation_slug VARCHAR(255) DEFAULT NULL,
    node_name_en    VARCHAR(255) DEFAULT NULL,
    info            VARCHAR(500) DEFAULT NULL,
    quantity        VARCHAR(50)  DEFAULT NULL,
    source          VARCHAR(20)  DEFAULT '7zap',
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    KEY idx_oem (oem_number),
    KEY idx_brand_slug (brand_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ── BLOK 2 — Eksik OEM'leri kopyala (tek seferlik) ────────
-- 4.34M unique OEM × catalog_parts.idx_part_number index lookup.
-- Beklenen süre: ~60-180 saniye. phpMyAdmin time-out olursa
-- BLOK 2-ALT (range-based fallback) kullanın.
INSERT INTO legacy_unique_parts
    (oem_number, name, brand_slug, generation_slug, node_name_en, info, quantity)
SELECT DISTINCT
    p.oem_number,
    MAX(p.name)            AS name,
    MAX(p.brand_slug)      AS brand_slug,
    MAX(p.generation_slug) AS generation_slug,
    MAX(p.node_name_en)    AS node_name_en,
    MAX(p.info)            AS info,
    MAX(p.quantity)        AS quantity
FROM parts p
WHERE p.oem_number IS NOT NULL
  AND p.oem_number <> ''
  AND NOT EXISTS (
      SELECT 1 FROM catalog_parts c
      WHERE c.part_number = p.oem_number COLLATE utf8mb4_turkish_ci
  )
GROUP BY p.oem_number;

-- ── BLOK 3 — Doğrulama ────────────────────────────────────
SELECT COUNT(*)            AS migrated_unique_oems,
       MIN(LENGTH(oem_number)) AS shortest_oem,
       MAX(LENGTH(oem_number)) AS longest_oem
FROM legacy_unique_parts;

-- ── BLOK 4 — İlk 30 örneği gör (sanity check) ─────────────
SELECT oem_number, name, brand_slug, generation_slug, node_name_en
FROM legacy_unique_parts
ORDER BY id
LIMIT 30;

-- ════════════════════════════════════════════════════════════
-- BLOK 2-ALT (FALLBACK) — Eğer Blok 2 time-out olduysa
-- ════════════════════════════════════════════════════════════
-- parts tablosunu id range'lerine bölerek 4 batch'te çalıştır.
-- (parts.id varsayımı: AUTO_INCREMENT PK var.)

-- BLOK 2-A (id ≤ 4M)
-- INSERT INTO legacy_unique_parts (oem_number, name, brand_slug, generation_slug, node_name_en, info, quantity)
-- SELECT DISTINCT p.oem_number, MAX(p.name), MAX(p.brand_slug), MAX(p.generation_slug),
--                MAX(p.node_name_en), MAX(p.info), MAX(p.quantity)
-- FROM parts p
-- WHERE p.id BETWEEN 1 AND 4000000
--   AND p.oem_number IS NOT NULL AND p.oem_number <> ''
--   AND NOT EXISTS (SELECT 1 FROM catalog_parts c WHERE c.part_number = p.oem_number COLLATE utf8mb4_turkish_ci)
-- GROUP BY p.oem_number
-- ON DUPLICATE KEY UPDATE id = id;
--
-- BLOK 2-B (id 4M-8M)   — aynı şablon, BETWEEN 4000001 AND 8000000
-- BLOK 2-C (id 8M-12M)  — aynı şablon, BETWEEN 8000001 AND 12000000
-- BLOK 2-D (id 12M-17M) — aynı şablon, BETWEEN 12000001 AND 17000000

-- NOT: ON DUPLICATE KEY UPDATE çalışması için unique key gerekir.
-- Eğer batch yapacaksanız önce şu index'i ekleyin:
--   ALTER TABLE legacy_unique_parts ADD UNIQUE KEY uk_oem (oem_number);
-- (id PK olduğu için DISTINCT zaten dedupe eder, ama batch'lerde aynı OEM
-- birden fazla range'de görünebilir.)
