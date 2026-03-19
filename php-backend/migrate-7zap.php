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
        case 5:
            $auto = (int)($_GET['auto'] ?? 0);
            if ($auto) {
                migrate_step5_auto($pdo, $offset, $batch);
            } else {
                migrate_step5_parts($pdo, $offset, $batch);
            }
            break;
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
    $pdo->exec("TRUNCATE TABLE migration_7zap_gen_map");

    // 1. Tüm 7zap generation_slug'larını al
    $allGens = $pdo->query("SELECT brand_slug, generation_slug FROM parts_gen_summary")->fetchAll(PDO::FETCH_ASSOC);

    // 2. brand_slug → manufacturer_id mapping'i yükle
    $brandMap = [];
    $bm = $pdo->query("SELECT brand_slug, manufacturer_id FROM migration_7zap_brand_map WHERE manufacturer_id IS NOT NULL");
    foreach ($bm->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $brandMap[$r['brand_slug']] = (int)$r['manufacturer_id'];
    }

    // 3. Her generation için manufacturer_id ile catalog_vehicles'dan en yakın vehicle'ı bul
    $insertStmt = $pdo->prepare("
        INSERT IGNORE INTO migration_7zap_gen_map
        (generation_slug, brand_slug, vehicle_id, model_id, manufacturer_id)
        VALUES (:gen_slug, :brand_slug, :vid, :mid, :manid)
    ");

    // manufacturer_id → ilk vehicle cache (basit eşleşme)
    $manVehicleCache = [];
    $vehicleStmt = $pdo->prepare("
        SELECT v.id AS vehicle_id, v.model_id
        FROM catalog_vehicles v
        JOIN catalog_models m ON v.model_id = m.id
        WHERE m.manufacturer_id = :manid
        ORDER BY v.id LIMIT 1
    ");

    $matched = 0;
    $unmatched = 0;

    foreach ($allGens as $gen) {
        $genSlug = $gen['generation_slug'];
        $brandSlug = $gen['brand_slug'];
        $manId = $brandMap[$brandSlug] ?? null;

        $vid = null;
        $mid = null;

        if ($manId) {
            if (!isset($manVehicleCache[$manId])) {
                $vehicleStmt->execute([':manid' => $manId]);
                $manVehicleCache[$manId] = $vehicleStmt->fetch(PDO::FETCH_ASSOC) ?: null;
            }
            if ($manVehicleCache[$manId]) {
                $vid = (int)$manVehicleCache[$manId]['vehicle_id'];
                $mid = (int)$manVehicleCache[$manId]['model_id'];
                $matched++;
            } else {
                $unmatched++;
            }
        } else {
            $unmatched++;
        }

        $insertStmt->execute([
            ':gen_slug' => $genSlug,
            ':brand_slug' => $brandSlug,
            ':vid' => $vid,
            ':mid' => $mid,
            ':manid' => $manId,
        ]);
    }

    echo json_encode([
        'step' => 3,
        'total_gens' => count($allGens),
        'matched_to_vehicle' => $matched,
        'unmatched' => $unmatched,
    ]);
}

// ── Step 4: Category Mapping ──
function migrate_step4_category_map($pdo) {
    // node_categories tablosundan direkt eşleşme (parts tablosuna dokunma!)
    $count = (int)$pdo->query("SELECT COUNT(*) FROM node_categories")->fetchColumn();

    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS migration_7zap_cat_map (
                node_name_en VARCHAR(500) PRIMARY KEY,
                category_id INT UNSIGNED,
                INDEX idx_cat (category_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    } catch (PDOException $e) { /* zaten mevcut */ }

    // category_id INT UNSIGNED → TEXT olarak değiştir (node_categories.category_id string)
    $pdo->exec("DROP TABLE IF EXISTS migration_7zap_cat_map");
    $pdo->exec("
        CREATE TABLE migration_7zap_cat_map (
            node_name_en VARCHAR(500) PRIMARY KEY,
            category_id VARCHAR(50),
            INDEX idx_cat (category_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // node_categories'den direkt kopyala (category_id string: engine, brake, etc.)
    $pdo->exec("
        INSERT IGNORE INTO migration_7zap_cat_map (node_name_en, category_id)
        SELECT node_name_en, category_id FROM node_categories
    ");

    $totalNodeCats = (int)$pdo->query("SELECT COUNT(*) FROM node_categories")->fetchColumn();
    $mapped = (int)$pdo->query("SELECT COUNT(*) FROM migration_7zap_cat_map")->fetchColumn();

    echo json_encode([
        'step' => 4,
        'node_categories_total' => $totalNodeCats,
        'mapped_to_catalog' => $mapped,
        'unmapped' => $totalNodeCats - $mapped,
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

            // part_vehicles ilişkisi ekle (category_id=NULL — 7zap'da INT category yok)
            try {
                $insertPV->execute([
                    ':pid' => $partId,
                    ':vid' => $vehicleId,
                    ':cid' => null,
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

// ── Step 5 Auto: Tüm batch'leri arka arkaya çalıştır ──
function migrate_step5_auto($pdo, $startOffset, $batchSize) {
    ignore_user_abort(true);
    set_time_limit(0);

    // Çıktıyı flush ederek real-time ilerleme göster
    header('Content-Type: text/plain; charset=utf-8');
    if (ob_get_level()) ob_end_flush();

    $oemSupplier = (int)$pdo->query("SELECT id FROM catalog_suppliers WHERE matchcode = 'OEM'")->fetchColumn();
    if (!$oemSupplier) { echo "HATA: OEM supplier bulunamadi\n"; return; }

    // Mapping cache'leri bir kez yükle
    $genMap = [];
    $genRows = $pdo->query("SELECT generation_slug, vehicle_id FROM migration_7zap_gen_map WHERE vehicle_id IS NOT NULL")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($genRows as $r) $genMap[$r['generation_slug']] = (int)$r['vehicle_id'];
    echo "Gen mapping yüklendi: " . count($genMap) . " kayıt\n";
    flush();

    $checkStmt = $pdo->prepare("SELECT id FROM catalog_parts WHERE oem_number = :oem AND supplier_id = :sid LIMIT 1");
    $insertPart = $pdo->prepare("INSERT INTO catalog_parts (supplier_id, part_number, name_tr, oem_number, source) VALUES (:sid, :pnum, :name, :oem, '7zap')");
    $insertPV = $pdo->prepare("INSERT IGNORE INTO catalog_part_vehicles (part_id, vehicle_id, category_id) VALUES (:pid, :vid, NULL)");

    $offset = $startOffset;
    $totalInserted = 0;
    $totalSkipped = 0;
    $totalPV = 0;
    $batchNum = 0;
    $globalStart = microtime(true);

    while (true) {
        $batchStart = microtime(true);
        $stmt = $pdo->prepare("SELECT id, oem_number, name_clean, generation_slug FROM parts ORDER BY id LIMIT :lim OFFSET :off");
        $stmt->bindValue(':lim', $batchSize, PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($rows)) break;

        $inserted = 0;
        $skipped = 0;
        $pvCount = 0;

        $pdo->beginTransaction();
        try {
            foreach ($rows as $row) {
                $oem = trim($row['oem_number']);
                if (!$oem) { $skipped++; continue; }

                $checkStmt->execute([':oem' => $oem, ':sid' => $oemSupplier]);
                $existingId = $checkStmt->fetchColumn();

                if ($existingId) {
                    $partId = (int)$existingId;
                    $skipped++;
                } else {
                    try {
                        $insertPart->execute([':sid' => $oemSupplier, ':pnum' => $oem, ':name' => $row['name_clean'] ?: null, ':oem' => $oem]);
                        $partId = (int)$pdo->lastInsertId();
                        $inserted++;
                    } catch (PDOException $e) { continue; }
                }

                $vid = $genMap[$row['generation_slug']] ?? null;
                if ($vid) {
                    try {
                        $insertPV->execute([':pid' => $partId, ':vid' => $vid]);
                        $pvCount++;
                    } catch (PDOException $e) {}
                }
            }
            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            echo "HATA batch $batchNum offset=$offset: " . $e->getMessage() . "\n";
            flush();
            break;
        }

        $totalInserted += $inserted;
        $totalSkipped += $skipped;
        $totalPV += $pvCount;
        $offset += $batchSize;
        $batchNum++;
        $batchElapsed = round(microtime(true) - $batchStart, 1);
        $totalElapsed = round(microtime(true) - $globalStart, 0);

        // Her 10 batch'te progress yaz
        if ($batchNum % 10 === 0) {
            echo "Batch $batchNum | offset=$offset | inserted=$totalInserted | skipped=$totalSkipped | pv=$totalPV | batch={$batchElapsed}s | total={$totalElapsed}s\n";
            flush();

            // Progress kaydet
            try {
                $pdo->prepare("INSERT INTO migration_7zap_progress (step, last_offset, rows_processed, status) VALUES ('parts_auto', :off, :cnt, 'in_progress')")
                    ->execute([':off' => $offset, ':cnt' => $totalInserted]);
            } catch (Exception $e) {}
        }
    }

    $totalElapsed = round(microtime(true) - $globalStart, 0);

    // Final progress
    try {
        $pdo->prepare("INSERT INTO migration_7zap_progress (step, last_offset, rows_processed, status, completed_at) VALUES ('parts_auto', :off, :cnt, 'completed', NOW())")
            ->execute([':off' => $offset, ':cnt' => $totalInserted]);
    } catch (Exception $e) {}

    echo "\n=== TAMAMLANDI ===\n";
    echo "Toplam batch: $batchNum\n";
    echo "Eklenen parça: $totalInserted\n";
    echo "Atlanan (duplicate): $totalSkipped\n";
    echo "Part-vehicle ilişki: $totalPV\n";
    echo "Toplam süre: {$totalElapsed}s\n";
    flush();
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
