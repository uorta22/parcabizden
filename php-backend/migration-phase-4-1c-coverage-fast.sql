-- ════════════════════════════════════════════════════════════
-- Faz 4.1c — Coverage Check (Index-friendly, sample-based)
-- ════════════════════════════════════════════════════════════
-- 4.1b'deki LEFT JOIN time-out yapıyordu çünkü COLLATE clause'u
-- catalog_parts.idx_part_number index'inin kullanılmasını engelliyordu.
--
-- Burada:
--   1) parts'tan örneklem alınıyor (önce küçük, sonra büyük).
--   2) NOT EXISTS subquery → LEFT JOIN yerine, optimizer için daha
--      kolay.
--   3) COLLATE catalog tarafına değil, parts tarafına uygulanıyor →
--      catalog_parts.idx_part_number kullanılabilir hale geliyor.
--
-- HER bloğu AYRI çalıştırın. Süreleri arttırarak gidin.
-- ════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

-- ── BLOK 1 — Sanity check: 100 örnek, ~saniye altı ────────
SELECT COUNT(*) AS missing_in_100_sample
FROM (
    SELECT DISTINCT oem_number FROM parts LIMIT 100
) p
WHERE NOT EXISTS (
    SELECT 1 FROM catalog_parts c
    WHERE c.part_number = p.oem_number COLLATE utf8mb4_turkish_ci
);

-- ── BLOK 2 — 1.000 örnek, ~5-10 saniye ────────────────────
SELECT COUNT(*) AS missing_in_1k_sample
FROM (
    SELECT DISTINCT oem_number FROM parts LIMIT 1000
) p
WHERE NOT EXISTS (
    SELECT 1 FROM catalog_parts c
    WHERE c.part_number = p.oem_number COLLATE utf8mb4_turkish_ci
);

-- ── BLOK 3 — 10.000 örnek, ~30-60 saniye ──────────────────
SELECT COUNT(*) AS missing_in_10k_sample
FROM (
    SELECT DISTINCT oem_number FROM parts LIMIT 10000
) p
WHERE NOT EXISTS (
    SELECT 1 FROM catalog_parts c
    WHERE c.part_number = p.oem_number COLLATE utf8mb4_turkish_ci
);

-- ── BLOK 4 — 50.000 örnek, ~3-5 dakika ────────────────────
-- phpMyAdmin time-out olabilir. Olmazsa istatistik anlamlı olur.
SELECT COUNT(*) AS missing_in_50k_sample
FROM (
    SELECT DISTINCT oem_number FROM parts LIMIT 50000
) p
WHERE NOT EXISTS (
    SELECT 1 FROM catalog_parts c
    WHERE c.part_number = p.oem_number COLLATE utf8mb4_turkish_ci
);

-- ── BLOK 5 — Eksik OEM örnekleri (tanılama) ───────────────
-- 1K sample'da bulunan eksiklerden 20 tane göster.
SELECT DISTINCT p.oem_number, p.name, p.brand_slug, p.generation_slug
FROM (
    SELECT oem_number, name, brand_slug, generation_slug FROM parts LIMIT 1000
) p
WHERE NOT EXISTS (
    SELECT 1 FROM catalog_parts c
    WHERE c.part_number = p.oem_number COLLATE utf8mb4_turkish_ci
)
LIMIT 20;

-- ── BLOK 6 — Tedarikçi bağımsız tam karşılaştırma (varsa) ──
-- catalog_parts (supplier_id, part_number) PK'lı; aynı OEM birden fazla
-- tedarikçide olabilir. parts ise sadece OEM tutuyor. Yani:
--    parts.oem_number → catalog_parts içinde EN AZ BİR row varsa kapsanmış.
-- Bu sorgu doğrudan o testtir.
-- (BLOK 1-4 zaten bunu yapıyor.)
