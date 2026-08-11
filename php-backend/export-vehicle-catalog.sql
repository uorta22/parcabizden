-- Arac katalogunu MySQL'den cikarma sorgulari.
--
-- Sunucuda SSH yok, o yuzden yol phpMyAdmin uzerinden CSV export.
-- Her sorguyu AYRI AYRI calistir, sonra sonuc ekraninin altindaki
-- "Disa aktar" -> CSV -> "Sutun adlarini ilk satira koy" isaretli ->
-- Git. Dosyayi Downloads'a kaydet, dosya adlarini asagidaki gibi birak.
--
-- NOT: Uzun -- yorum bloklari phpMyAdmin'in parser'ini bogup batch'i
-- #1044 ile reddettiriyor. Sorgulari tek tek calistir, hepsini birden
-- yapistirma.

-- ── 1/4 → vehicle_manufacturers.csv  (32 satir) ─────────────────────
SELECT id, name, matchcode
FROM catalog_manufacturers
ORDER BY id;

-- ── 2/4 → vehicle_models.csv  (6.346 satir) ─────────────────────────
SELECT id, manufacturer_id, name, full_name, year_range
FROM catalog_models
ORDER BY id;

-- ── 3/4 → vehicles.csv  (~22.276 satir) ─────────────────────────────
-- Motor kodlari burada birlestiriliyor: Postgres tarafinda ayri tablo
-- yok, engine_codes dizisi var. Ayirici "|" cunku kodlarin kendisinde
-- virgul gecebiliyor ve CSV'de virgul alan ayiricisi.
-- can_be_displayed = 1: uygulama zaten yalnizca bunlari gosteriyor.
SELECT v.id,
       v.model_id,
       v.description,
       v.full_name,
       v.year_from,
       v.year_to,
       GROUP_CONCAT(DISTINCT NULLIF(e.code, '') ORDER BY e.code SEPARATOR '|') AS engine_codes
FROM catalog_vehicles v
LEFT JOIN catalog_vehicle_engines ve ON ve.vehicle_id = v.id
LEFT JOIN catalog_engines e ON e.id = ve.engine_id
WHERE v.can_be_displayed = 1
GROUP BY v.id, v.model_id, v.description, v.full_name, v.year_from, v.year_to
ORDER BY v.id;

-- ── 4/4 → vehicle_attributes.csv  (~180.000 satir) ──────────────────
-- 1,72M satirin tamami degil: yalnizca UI'in okudugu basliklar.
-- Kaynak: buildSpecs() — src/app/(site)/arac/[ktype]/page.tsx
-- Ayni araçta "Power" iki kez geçer (kW ve PS), "Capacity" de öyle
-- (ccm ve litre); ikisi de bilerek aliniyor, UI onlari ayirt ediyor.
SELECT a.vehicle_id,
       a.attribute_group,
       a.display_title,
       a.display_value
FROM catalog_vehicle_attributes a
JOIN catalog_vehicles v ON v.id = a.vehicle_id AND v.can_be_displayed = 1
WHERE a.display_title IN (
    'Capacity (technic)', 'Capacity', 'Motor hacmi',
    'Power', 'Güç',
    'Fuel type', 'Yakıt tipi',
    'Engine code', 'Motor kodu',
    'Transmission type', 'Şanzıman'
)
ORDER BY a.vehicle_id;

-- ── Kontrol ─────────────────────────────────────────────────────────
-- Export'lardan once calistir, beklenen satir sayilarini gor.
SELECT 'manufacturers' AS tablo, COUNT(*) AS satir FROM catalog_manufacturers
UNION ALL SELECT 'models',   COUNT(*) FROM catalog_models
UNION ALL SELECT 'vehicles', COUNT(*) FROM catalog_vehicles WHERE can_be_displayed = 1
UNION ALL SELECT 'attributes', COUNT(*)
    FROM catalog_vehicle_attributes a
    JOIN catalog_vehicles v ON v.id = a.vehicle_id AND v.can_be_displayed = 1
    WHERE a.display_title IN (
        'Capacity (technic)', 'Capacity', 'Motor hacmi', 'Power', 'Güç',
        'Fuel type', 'Yakıt tipi', 'Engine code', 'Motor kodu',
        'Transmission type', 'Şanzıman');
