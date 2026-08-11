-- Arac ozellik verisinin gercek kapsami.
--
-- Neden: catalog_vehicle_attributes icinde IKI ayri veri seti var.
--   A) Turkce, zengin: "Transmission" = "6 vites, manuel sanziman",
--      "Body Type" = "Sedan", "Drivetrain" = "Onden cekis"
--   B) TecDoc asli, Rusca: "Body type" = "седан", "Fuel type" = "Дизель"
--
-- A seti wizard icin tam istedigimiz sey ama ornekleme onun araclarin
-- kucuk bir kisminda oldugunu gosteriyor. Bu sorgular kesin sayiyi verir.
--
-- phpMyAdmin'de TEK TEK calistir.

-- ── 1) Turkce set kac araci kapsiyor ────────────────────────────────
SELECT COUNT(DISTINCT vehicle_id) AS turkce_setli_arac
FROM catalog_vehicle_attributes
WHERE display_title IN ('Transmission','Body Type','Drivetrain','Fuel Type',
                        'Engine CC','Power (HP)','Torque (Nm)','Generation','Modification');

-- ── 2) Basliga gore kapsam ──────────────────────────────────────────
SELECT display_title, COUNT(DISTINCT vehicle_id) AS arac
FROM catalog_vehicle_attributes
WHERE display_title IN ('Transmission','Body Type','Drivetrain','Fuel Type',
                        'Engine CC','Power (HP)','Torque (Nm)','Cylinders',
                        'Doors','Seats','Generation','Modification',
                        'Length (mm)','Width (mm)','Height (mm)',
                        'Wheelbase (mm)','Weight (kg)','Fuel Tank (L)',
                        'Emission norm','Number of valves')
GROUP BY display_title
ORDER BY arac DESC;

-- ── 3) Rusca setin kapsami (karsilastirma icin) ─────────────────────
SELECT display_title, COUNT(DISTINCT vehicle_id) AS arac
FROM catalog_vehicle_attributes
WHERE display_title IN ('Body type','Drive type','Fuel type','Engine type',
                        'Fuel mixture','Cooling type','Charge type')
GROUP BY display_title
ORDER BY arac DESC;

-- ── 4) Rusca degerlerin sozlugu ─────────────────────────────────────
-- Bunlar enum gibi kapali bir kume. Kac farkli deger oldugunu gorursek
-- Turkceye elle eslenip TUM araclara zengin veri kazandirilabilir —
-- disaridan veri satin almadan.
SELECT display_title, display_value, COUNT(*) AS adet
FROM catalog_vehicle_attributes
WHERE display_title IN ('Body type','Drive type','Fuel type','Engine type')
GROUP BY display_title, display_value
ORDER BY display_title, adet DESC;

-- ── 5) Katalogda baska ne var ───────────────────────────────────────
-- Ornekleme yalnizca 50 araci gordu; tam baslik listesi bunu verir.
SELECT display_title, COUNT(*) AS satir, COUNT(DISTINCT vehicle_id) AS arac
FROM catalog_vehicle_attributes
GROUP BY display_title
ORDER BY arac DESC;
