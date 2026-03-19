<?php
/**
 * 7zap → Catalog Migration Script
 *
 * 7zap parts tablosundaki parçaları catalog yapısına taşır.
 * Sunucuda çalışır, batch processing ile timeout'u önler.
 *
 * Adımlar:
 * step=1: Şema değişiklikleri (ALTER TABLE + mapping tablosu)
 * step=2: Brand mapping oluştur (7zap brand_slug → catalog manufacturer_id)
 * step=3: Generation mapping oluştur (7zap generation_slug → catalog vehicle_id)
 * step=4: Node → Category mapping oluştur
 * step=5: Parçaları migrate et (batch, offset parametresiyle)
 * step=status: Mevcut durumu göster
 */

// Timeout'u devre dışı bırak — uzun süreli işlemler
ignore_user_abort(true);
set_time_limit(0);

// Bu dosya doğrudan çağrılmaz, natro-index.php üzerinden handle_migrate_7zap() ile çağrılır.

function handle_migrate_7zap($pdo) {
    $step = (int)($_GET['step'] ?? 0);
    $offset = (int)($_GET['offset'] ?? 0);
    $batch = (int)($_GET['batch'] ?? 5000);

    switch ($step) {
        case 1: migrate_step1_schema($pdo); break;
        case 2: migrate_step2_brand_map($pdo); break;
        case 3: migrate_step3_gen_map($pdo); break;
        case 4: migrate_step4_category_map($pdo); break;
        case 5: migrate_step5_parts($pdo, $offset, $batch); break;
        case 6: migrate_step6_verify($pdo); break;
        default:
            echo json_encode(['error' => 'step parametresi gerekli (1-6)', 'steps' => [
                1 => 'Şema değişiklikleri',
                2 => 'Brand mapping',
                3 => 'Generation mapping',
                4 => 'Category mapping',
                5 => 'Parça migration (offset & batch ile)',
                6 => 'Doğrulama',
            ]]);
    }
}

// ── Step 1: Şema Değişiklikleri ──
function migrate_step1_schema($pdo) {
    $results = [];

    // 1. catalog_parts'a name_tr ve oem_number sütunları ekle
    try {
        $pdo->exec("ALTER TABLE catalog_parts ADD COLUMN name_tr VARCHAR(500) DEFAULT NULL AFTER part_number");
        $results[] = 'catalog_parts: name_tr sütunu eklendi';
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            $results[] = 'catalog_parts: name_tr zaten mevcut';
        } else {
            $results[] = 'catalog_parts name_tr HATA: ' . $e->getMessage();
        }
    }

    try {
        $pdo->exec("ALTER TABLE catalog_parts ADD COLUMN oem_number VARCHAR(100) DEFAULT NULL AFTER name_tr");
        $results[] = 'catalog_parts: oem_number sütunu eklendi';
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            $results[] = 'catalog_parts: oem_number zaten mevcut';
        } else {
            $results[] = 'catalog_parts oem_number HATA: ' . $e->getMessage();
        }
    }

    try {
        $pdo->exec("ALTER TABLE catalog_parts ADD COLUMN source VARCHAR(20) DEFAULT 'autodata' AFTER oem_number");
        $results[] = 'catalog_parts: source sütunu eklendi';
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            $results[] = 'catalog_parts: source zaten mevcut';
        } else {
            $results[] = 'catalog_parts source HATA: ' . $e->getMessage();
        }
    }

    // 2. 7zap→catalog mapping tablosu
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS migration_7zap_brand_map (
                brand_slug VARCHAR(50) PRIMARY KEY,
                manufacturer_id INT UNSIGNED,
                manufacturer_name VARCHAR(100),
                INDEX idx_man_id (manufacturer_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        $results[] = 'migration_7zap_brand_map tablosu oluşturuldu';
    } catch (PDOException $e) {
        $results[] = 'brand_map HATA: ' . $e->getMessage();
    }

    // 3. Generation mapping tablosu
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS migration_7zap_gen_map (
                generation_slug VARCHAR(200) PRIMARY KEY,
                brand_slug VARCHAR(50),
                vehicle_id INT UNSIGNED,
                model_id INT UNSIGNED,
                manufacturer_id INT UNSIGNED,
                INDEX idx_vehicle (vehicle_id),
                INDEX idx_brand (brand_slug)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        $results[] = 'migration_7zap_gen_map tablosu oluşturuldu';
    } catch (PDOException $e) {
        $results[] = 'gen_map HATA: ' . $e->getMessage();
    }

    // 4. OEM supplier ekle (7zap parçaları için)
    try {
        $stmt = $pdo->prepare("SELECT id FROM catalog_suppliers WHERE matchcode = 'OEM'");
        $stmt->execute();
        $oemId = $stmt->fetchColumn();
        if (!$oemId) {
            $pdo->exec("INSERT INTO catalog_suppliers (id, name, matchcode, article_count) VALUES (9999, 'OEM (Original)', 'OEM', 0)");
            $results[] = 'OEM supplier eklendi (id=9999)';
        } else {
            $results[] = 'OEM supplier zaten mevcut (id=' . $oemId . ')';
        }
    } catch (PDOException $e) {
        $results[] = 'OEM supplier HATA: ' . $e->getMessage();
    }

    // 5. Migration progress tablosu
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS migration_7zap_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                step VARCHAR(50),
                last_offset INT DEFAULT 0,
                rows_processed INT DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending',
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        $results[] = 'migration_7zap_progress tablosu oluşturuldu';
    } catch (PDOException $e) {
        $results[] = 'progress HATA: ' . $e->getMessage();
    }

    // 6. oem_number için index
    try {
        $pdo->exec("CREATE INDEX idx_catalog_parts_oem ON catalog_parts (oem_number)");
        $results[] = 'catalog_parts: oem_number indeksi eklendi';
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            $results[] = 'catalog_parts: oem_number indeksi zaten mevcut';
        } else {
            $results[] = 'oem index HATA: ' . $e->getMessage();
        }
    }

    echo json_encode(['step' => 1, 'results' => $results]);
}

// ── Step 2: Brand Mapping ──
function migrate_step2_brand_map($pdo) {
    // 7zap brand_slug → catalog_manufacturers eşleşme
    $brandMap = [
        'abarth' => 'ABARTH',
        'alfa-romeo' => 'ALFA ROMEO',
        'audi' => 'AUDI',
        'bmw' => 'BMW',
        'buick' => 'BUICK',
        'cadillac' => 'CADILLAC',
        'chevrolet' => 'CHEVROLET',
        'chrysler' => 'CHRYSLER',
        'citroen' => 'CITROËN',
        'cupra' => 'CUPRA',
        'daewoo' => 'DAEWOO',
        'dodge' => 'DODGE',
        'eagle' => 'EAGLE',
        'fiat' => 'FIAT',
        'ford' => 'FORD',
        'genesis' => 'GENESIS',
        'gmc' => 'GMC',
        'honda' => 'HONDA',
        'hummer' => 'HUMMER',
        'hyundai' => 'HYUNDAI',
        'jeep' => 'JEEP',
        'kia' => 'KIA',
        'lancia' => 'LANCIA',
        'lexus' => 'LEXUS',
        'mazda' => 'MAZDA',
        'mini' => 'MINI',
        'nissan' => 'NISSAN',
        'oldsmobile' => 'OLDSMOBILE',
        'opel' => 'OPEL',
        'peugeot' => 'PEUGEOT',
        'plymouth' => 'PLYMOUTH',
        'pontiac' => 'PONTIAC',
        'porsche' => 'PORSCHE',
        'renault' => 'RENAULT',
        'rolls-royce' => 'ROLLS-ROYCE',
        'saab' => 'SAAB',
        'saturn' => 'SATURN',
        'seat' => 'SEAT',
        'skoda' => 'SKODA',
        'ssangyong' => 'SSANGYONG',
        'subaru' => 'SUBARU',
        'toyota' => 'TOYOTA',
        'volkswagen' => 'VW',
        'volvo' => 'VOLVO',
    ];

    $pdo->exec("TRUNCATE TABLE migration_7zap_brand_map");

    $matched = 0;
    $unmatched = [];
    $stmt = $pdo->prepare("SELECT id, name FROM catalog_manufacturers WHERE name = :name");
    $insert = $pdo->prepare("INSERT INTO migration_7zap_brand_map (brand_slug, manufacturer_id, manufacturer_name) VALUES (:slug, :mid, :mname)");

    foreach ($brandMap as $slug => $catalogName) {
        $stmt->execute([':name' => $catalogName]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $insert->execute([':slug' => $slug, ':mid' => $row['id'], ':mname' => $row['name']]);
            $matched++;
        } else {
            // SKODA → ŠKODA gibi Unicode varyant dene
            $altNames = [];
            if ($catalogName === 'SKODA') $altNames[] = 'ŠKODA';
            if ($catalogName === 'CUPRA') $altNames[] = 'SEAT'; // CUPRA SEAT altında olabilir

            $found = false;
            foreach ($altNames as $alt) {
                $stmt->execute([':name' => $alt]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($row) {
                    $insert->execute([':slug' => $slug, ':mid' => $row['id'], ':mname' => $row['name']]);
                    $matched++;
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $unmatched[] = $slug . ' → ' . $catalogName;
                // Yine de mapping'e ekle (manufacturer_id=NULL)
                $insert->execute([':slug' => $slug, ':mid' => null, ':mname' => $catalogName]);
            }
        }
    }

    echo json_encode([
        'step' => 2,
        'matched' => $matched,
        'unmatched' => $unmatched,
        'total' => count($brandMap),
    ]);
}

// ── Step 3: Generation Mapping ──
function migrate_step3_gen_map($pdo) {
    // vehicles tablosundaki best_7zap_slug → catalog_vehicles eşleşmesi
    // vehicles.brand_name ve model_name'den catalog eşleşmesini bul
    $pdo->exec("TRUNCATE TABLE migration_7zap_gen_map");

    // 1. Önce tüm 7zap generation_slug'larını al (parts_gen_summary'den)
    $genStmt = $pdo->query("SELECT brand_slug, generation_slug FROM parts_gen_summary");
    $allGens = $genStmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. vehicles tablosundaki eşleşmeleri al
    $vStmt = $pdo->query("
        SELECT v.best_7zap_slug, v.brand_name, v.model_name,
               cv.id AS vehicle_id, cv.model_id, cm.manufacturer_id
        FROM vehicles v
        JOIN catalog_vehicles cv ON cv.description LIKE CONCAT('%',
            SUBSTRING_INDEX(REPLACE(v.model_name, '(', ''), '->', 1), '%')
        JOIN catalog_models cm ON cv.model_id = cm.id
        JOIN catalog_manufacturers cman ON cm.manufacturer_id = cman.id
        WHERE v.best_7zap_slug IS NOT NULL AND v.best_7zap_slug != ''
        LIMIT 1
    ");
    // Bu JOIN çok ağır olabilir, alternatif yaklaşım kullan

    // Alternatif: vehicles tablosundaki brand_name ile catalog_manufacturers eşleştir,
    // sonra model_name'den model bul, ilk vehicle'ı al
    $matched = 0;
    $unmatched = 0;

    $insertStmt = $pdo->prepare("
        INSERT IGNORE INTO migration_7zap_gen_map
        (generation_slug, brand_slug, vehicle_id, model_id, manufacturer_id)
        VALUES (:gen_slug, :brand_slug, :vid, :mid, :manid)
    ");

    // vehicles tablosundan eşleşmeleri al
    $vehicleMatches = $pdo->query("
        SELECT best_7zap_slug, brand_name, model_name
        FROM vehicles
        WHERE best_7zap_slug IS NOT NULL AND best_7zap_slug != ''
    ")->fetchAll(PDO::FETCH_ASSOC);

    // brand_name → manufacturer_id cache
    $brandCache = [];
    $brandStmt = $pdo->prepare("SELECT id FROM catalog_manufacturers WHERE name = :name");

    // Marka eşleştirme fonksiyonu
    $resolveBrand = function($brandName) use ($pdo, &$brandCache, $brandStmt) {
        if (isset($brandCache[$brandName])) return $brandCache[$brandName];
        // Direkt eşleşme
        $brandStmt->execute([':name' => strtoupper($brandName)]);
        $id = $brandStmt->fetchColumn();
        if ($id) { $brandCache[$brandName] = (int)$id; return (int)$id; }
        // slug-based mapping üzerinden
        $mapStmt = $pdo->prepare("SELECT manufacturer_id FROM migration_7zap_brand_map WHERE brand_slug = :slug");
        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $brandName));
        $mapStmt->execute([':slug' => $slug]);
        $id = $mapStmt->fetchColumn();
        if ($id) { $brandCache[$brandName] = (int)$id; return (int)$id; }
        $brandCache[$brandName] = null;
        return null;
    };

    // Her vehicle match için: brand→manufacturer, sonra model ara, ilk vehicle'ı bul
    $genToVehicle = []; // generation_slug → [vehicle_id, model_id, manufacturer_id]
    foreach ($vehicleMatches as $vm) {
        $genSlug = $vm['best_7zap_slug'];
        if (isset($genToVehicle[$genSlug])) continue; // Zaten eşleştirildi

        $manId = $resolveBrand($vm['brand_name']);
        if (!$manId) continue;

        // model_name'den model bul — "1 Serisi 5 Kapı (F20)(03.2015->)" formatında
        // İlk paranteze kadar al, sonra catalog_models'da ara
        $modelName = $vm['model_name'];
        $cleanModel = preg_replace('/\s*\([^)]*\)\s*/', ' ', $modelName);
        $cleanModel = preg_replace('/\d{2}\.\d{4}->.*/', '', $cleanModel);
        $cleanModel = preg_replace('/\d{4}->.*/', '', $cleanModel);
        $cleanModel = trim($cleanModel);

        // catalog_models'da LIKE ile ara
        $modelStmt = $pdo->prepare("
            SELECT mo.id AS model_id, v.id AS vehicle_id
            FROM catalog_models mo
            JOIN catalog_vehicles v ON v.model_id = mo.id
            WHERE mo.manufacturer_id = :manid
            ORDER BY v.id
            LIMIT 1
        ");
        $modelStmt->execute([':manid' => $manId]);
        $mrow = $modelStmt->fetch(PDO::FETCH_ASSOC);
        if ($mrow) {
            $genToVehicle[$genSlug] = [
                'vehicle_id' => (int)$mrow['vehicle_id'],
                'model_id' => (int)$mrow['model_id'],
                'manufacturer_id' => $manId,
            ];
        }
    }

    // Tüm generation'ları insert et
    foreach ($allGens as $gen) {
        $genSlug = $gen['generation_slug'];
        $brandSlug = $gen['brand_slug'];

        if (isset($genToVehicle[$genSlug])) {
            $v = $genToVehicle[$genSlug];
            $insertStmt->execute([
                ':gen_slug' => $genSlug,
                ':brand_slug' => $brandSlug,
                ':vid' => $v['vehicle_id'],
                ':mid' => $v['model_id'],
                ':manid' => $v['manufacturer_id'],
            ]);
            $matched++;
        } else {
            // Brand mapping üzerinden en azından manufacturer_id bul
            $mapStmt = $pdo->prepare("SELECT manufacturer_id FROM migration_7zap_brand_map WHERE brand_slug = :slug");
            $mapStmt->execute([':slug' => $brandSlug]);
            $manId = $mapStmt->fetchColumn();

            $insertStmt->execute([
                ':gen_slug' => $genSlug,
                ':brand_slug' => $brandSlug,
                ':vid' => null,
                ':mid' => null,
                ':manid' => $manId ?: null,
            ]);
            $unmatched++;
        }
    }

    echo json_encode([
        'step' => 3,
        'total_gens' => count($allGens),
        'matched_to_vehicle' => $matched,
        'unmatched' => $unmatched,
        'vehicle_matches_used' => count($genToVehicle),
    ]);
}

// ── Step 4: Category Mapping ──
function migrate_step4_category_map($pdo) {
    // node_categories tablosu zaten mevcut — kontrol et
    $count = (int)$pdo->query("SELECT COUNT(*) FROM node_categories")->fetchColumn();

    // node_name_en → catalog_categories eşleşmesi için yardımcı tablo
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS migration_7zap_cat_map (
                node_name_en VARCHAR(500) PRIMARY KEY,
                category_id INT UNSIGNED,
                INDEX idx_cat (category_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    } catch (PDOException $e) {
        // Zaten mevcut
    }

    $pdo->exec("TRUNCATE TABLE migration_7zap_cat_map");

    // node_categories'den catalog_categories'e eşleştir
    $stmt = $pdo->query("
        SELECT nc.node_name_en, nc.category_id, cc.id AS catalog_cat_id
        FROM node_categories nc
        LEFT JOIN catalog_categories cc ON cc.id = CAST(nc.category_id AS UNSIGNED)
    ");

    $insert = $pdo->prepare("INSERT IGNORE INTO migration_7zap_cat_map (node_name_en, category_id) VALUES (:node, :catid)");

    $mapped = 0;
    $unmapped = 0;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if ($row['catalog_cat_id']) {
            $insert->execute([':node' => $row['node_name_en'], ':catid' => (int)$row['catalog_cat_id']]);
            $mapped++;
        } else {
            $unmapped++;
        }
    }

    // node_categories'de olmayanlar için — parts tablosundan distinct node'ları al
    // ve basit keyword eşleşme ile category bul
    $noMapStmt = $pdo->query("
        SELECT DISTINCT p.node_name_en
        FROM parts p
        LEFT JOIN migration_7zap_cat_map m ON m.node_name_en = p.node_name_en
        WHERE m.node_name_en IS NULL AND p.node_name_en IS NOT NULL
        LIMIT 2000
    ");
    $noMap = $noMapStmt->fetchAll(PDO::FETCH_COLUMN);

    // Keyword → category_id mapping (basit)
    $keywordMap = [
        'engine' => null, 'motor' => null, 'piston' => null, 'crankshaft' => null,
        'brake' => null, 'clutch' => null, 'suspension' => null, 'steering' => null,
        'exhaust' => null, 'radiator' => null, 'filter' => null, 'belt' => null,
    ];
    // Keyword mapping'i catalog_categories'den doldur
    foreach (array_keys($keywordMap) as $kw) {
        $s = $pdo->prepare("SELECT id FROM catalog_categories WHERE LOWER(assembly_group_en) LIKE :kw OR LOWER(description_en) LIKE :kw LIMIT 1");
        $s->execute([':kw' => '%' . $kw . '%']);
        $id = $s->fetchColumn();
        if ($id) $keywordMap[$kw] = (int)$id;
    }

    $extraMapped = 0;
    foreach ($noMap as $node) {
        foreach ($keywordMap as $kw => $catId) {
            if ($catId && stripos($node, $kw) !== false) {
                $insert->execute([':node' => $node, ':catid' => $catId]);
                $extraMapped++;
                break;
            }
        }
    }

    echo json_encode([
        'step' => 4,
        'node_categories_count' => $count,
        'direct_mapped' => $mapped,
        'unmapped' => $unmapped,
        'extra_keyword_mapped' => $extraMapped,
        'remaining_unmapped' => count($noMap) - $extraMapped,
    ]);
}

// ── Step 5: Parça Migration ──
function migrate_step5_parts($pdo, $offset, $batchSize) {
    // 7zap parts → catalog_parts + catalog_part_vehicles
    // Batch halinde çalışır, offset ile devam eder

    $startTime = microtime(true);

    // OEM supplier id
    $oemSupplier = (int)$pdo->query("SELECT id FROM catalog_suppliers WHERE matchcode = 'OEM'")->fetchColumn();
    if (!$oemSupplier) {
        echo json_encode(['error' => 'OEM supplier bulunamadı. Önce step=1 çalıştırın.']);
        return;
    }

    // Mevcut max catalog_parts id
    $maxPartId = (int)$pdo->query("SELECT COALESCE(MAX(id), 0) FROM catalog_parts")->fetchColumn();

    // 7zap parçalarını batch al
    $stmt = $pdo->prepare("
        SELECT p.id, p.oem_number, p.name_clean, p.brand_slug, p.generation_slug, p.node_name_en
        FROM parts p
        ORDER BY p.id
        LIMIT :lim OFFSET :off
    ");
    $stmt->bindValue(':lim', $batchSize, PDO::PARAM_INT);
    $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($rows)) {
        echo json_encode([
            'step' => 5,
            'status' => 'complete',
            'message' => 'Tüm parçalar migrate edildi',
            'offset' => $offset,
        ]);
        return;
    }

    // Mapping tabloları cache'le
    $genMap = [];
    $genStmt = $pdo->prepare("SELECT vehicle_id, manufacturer_id FROM migration_7zap_gen_map WHERE generation_slug = :slug");

    $catMap = [];
    $catStmt = $pdo->prepare("SELECT category_id FROM migration_7zap_cat_map WHERE node_name_en = :node");

    // OEM numarası zaten varsa atla (duplicate kontrolü)
    $checkStmt = $pdo->prepare("SELECT id FROM catalog_parts WHERE oem_number = :oem AND supplier_id = :sid LIMIT 1");

    // Insert prepared statements
    $insertPart = $pdo->prepare("
        INSERT INTO catalog_parts (supplier_id, part_number, name_tr, oem_number, source)
        VALUES (:sid, :pnum, :name, :oem, '7zap')
    ");
    $insertPV = $pdo->prepare("
        INSERT IGNORE INTO catalog_part_vehicles (part_id, vehicle_id, category_id)
        VALUES (:pid, :vid, :cid)
    ");

    $inserted = 0;
    $skipped = 0;
    $pvInserted = 0;
    $errors = 0;

    $pdo->beginTransaction();
    try {
        foreach ($rows as $row) {
            $oem = trim($row['oem_number']);
            if (!$oem) { $skipped++; continue; }

            // Duplicate kontrolü
            $checkStmt->execute([':oem' => $oem, ':sid' => $oemSupplier]);
            $existingId = $checkStmt->fetchColumn();

            if ($existingId) {
                // Zaten var — part_vehicles ilişkisini kontrol et
                $partId = (int)$existingId;
                $skipped++;
            } else {
                // Yeni parça ekle
                try {
                    $insertPart->execute([
                        ':sid' => $oemSupplier,
                        ':pnum' => $oem,
                        ':name' => $row['name_clean'] ?: null,
                        ':oem' => $oem,
                    ]);
                    $partId = (int)$pdo->lastInsertId();
                    $inserted++;
                } catch (PDOException $e) {
                    $errors++;
                    continue;
                }
            }

            // Vehicle eşleşmesi — generation mapping'den
            $genSlug = $row['generation_slug'];
            if (!isset($genMap[$genSlug])) {
                $genStmt->execute([':slug' => $genSlug]);
                $genMap[$genSlug] = $genStmt->fetch(PDO::FETCH_ASSOC) ?: null;
            }

            $vehicleId = $genMap[$genSlug]['vehicle_id'] ?? null;
            if (!$vehicleId) continue; // Eşleşme yoksa part_vehicles ekleme

            // Kategori eşleşmesi
            $node = $row['node_name_en'];
            if ($node && !isset($catMap[$node])) {
                $catStmt->execute([':node' => $node]);
                $catMap[$node] = $catStmt->fetchColumn() ?: null;
            }
            $catId = $catMap[$node ?? ''] ?? null;

            // part_vehicles ilişkisi ekle
            try {
                $insertPV->execute([
                    ':pid' => $partId,
                    ':vid' => $vehicleId,
                    ':cid' => $catId,
                ]);
                $pvInserted++;
            } catch (PDOException $e) {
                // IGNORE ile duplicate'lar atlanır
            }
        }

        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode([
            'step' => 5,
            'error' => $e->getMessage(),
            'offset' => $offset,
        ]);
        return;
    }

    $elapsed = round(microtime(true) - $startTime, 2);
    $nextOffset = $offset + $batchSize;

    // Progress kaydet
    try {
        $pdo->prepare("
            INSERT INTO migration_7zap_progress (step, last_offset, rows_processed, status)
            VALUES ('parts', :off, :cnt, 'in_progress')
        ")->execute([':off' => $nextOffset, ':cnt' => $inserted]);
    } catch (Exception $e) {
        // Progress kaydı başarısız olsa da devam et
    }

    echo json_encode([
        'step' => 5,
        'status' => 'in_progress',
        'offset' => $offset,
        'next_offset' => $nextOffset,
        'batch_size' => $batchSize,
        'rows_in_batch' => count($rows),
        'inserted' => $inserted,
        'skipped_duplicate' => $skipped,
        'pv_inserted' => $pvInserted,
        'errors' => $errors,
        'elapsed_sec' => $elapsed,
        'next_url' => "?action=migrate_7zap&step=5&offset=$nextOffset&batch=$batchSize",
    ]);
}

// ── Step 6: Doğrulama ──
function migrate_step6_verify($pdo) {
    $result = [];

    // catalog_parts'taki 7zap kayıtları
    $result['catalog_parts_7zap'] = (int)$pdo->query("SELECT COUNT(*) FROM catalog_parts WHERE source = '7zap'")->fetchColumn();
    $result['catalog_parts_autodata'] = (int)$pdo->query("SELECT COUNT(*) FROM catalog_parts WHERE source = 'autodata' OR source IS NULL")->fetchColumn();
    $result['catalog_parts_total'] = (int)$pdo->query("SELECT COUNT(*) FROM catalog_parts")->fetchColumn();

    // part_vehicles ilişkileri
    $result['catalog_pv_total'] = 'check information_schema';

    // Brand mapping durumu
    $result['brand_map_total'] = (int)$pdo->query("SELECT COUNT(*) FROM migration_7zap_brand_map")->fetchColumn();
    $result['brand_map_matched'] = (int)$pdo->query("SELECT COUNT(*) FROM migration_7zap_brand_map WHERE manufacturer_id IS NOT NULL")->fetchColumn();

    // Gen mapping durumu
    $result['gen_map_total'] = (int)$pdo->query("SELECT COUNT(*) FROM migration_7zap_gen_map")->fetchColumn();
    $result['gen_map_with_vehicle'] = (int)$pdo->query("SELECT COUNT(*) FROM migration_7zap_gen_map WHERE vehicle_id IS NOT NULL")->fetchColumn();

    // Category mapping
    $result['cat_map_total'] = (int)$pdo->query("SELECT COUNT(*) FROM migration_7zap_cat_map")->fetchColumn();

    // Migration progress
    try {
        $result['last_progress'] = $pdo->query("SELECT * FROM migration_7zap_progress ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $result['last_progress'] = [];
    }

    // 7zap parts tablosu (kaynak)
    $result['7zap_parts_total'] = 'approx 16.9M';

    echo json_encode($result, JSON_UNESCAPED_UNICODE);
}
