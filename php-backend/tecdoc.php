<?php
/**
 * TecDoc Catalog Handlers — ID tabanlı temiz zincir
 *
 * Veri zinciri:
 *   catalog_manufacturers (id, name)
 *     └─ catalog_models (id, manufacturer_id, name, full_name, year_range)
 *         └─ catalog_vehicles (id [KType], model_id, description, year_from, year_to)
 *             └─ catalog_vehicle_engines (vehicle_id, engine_id) → catalog_engines
 *             └─ catalog_vehicle_attributes (vehicle_id, ...)
 *             └─ catalog_part_vehicles (part_id, vehicle_id, category_id) → catalog_categories
 *                 └─ catalog_parts (id, supplier_id, part_number) → catalog_suppliers
 *                     └─ catalog_part_images
 *                     └─ catalog_cross_ref
 *
 * Tüm sorgular prepared statement + INT cast ile koruma altında.
 * Slug tabanlı fuzzy matching YOKTUR — her şey deterministik ID üzerinden.
 */

// ============================================================
// 1) Marka listesi
// ============================================================
function tecdoc_brands($pdo) {
    $popular = isset($_GET['popular']) && $_GET['popular'] === '1';
    $sql = "SELECT id, name, matchcode FROM catalog_manufacturers ORDER BY name";
    if ($popular) {
        // Popüler markalar — model sayısına göre top 30
        $sql = "SELECT m.id, m.name, m.matchcode, COUNT(md.id) AS model_count
                FROM catalog_manufacturers m
                LEFT JOIN catalog_models md ON md.manufacturer_id = m.id
                GROUP BY m.id, m.name, m.matchcode
                ORDER BY model_count DESC, m.name
                LIMIT 30";
    }
    $stmt = $pdo->query($sql);
    $brands = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['brands' => $brands], JSON_UNESCAPED_UNICODE);
}

// ============================================================
// 2) Model listesi (markaya göre)
// ============================================================
function tecdoc_models($pdo) {
    $manufacturerId = (int)($_GET['manufacturer_id'] ?? 0);
    if ($manufacturerId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'manufacturer_id parametresi gerekli']);
        return;
    }
    $stmt = $pdo->prepare("
        SELECT id, manufacturer_id, name, full_name, year_range
        FROM catalog_models
        WHERE manufacturer_id = :mid
        ORDER BY name
    ");
    $stmt->bindValue(':mid', $manufacturerId, PDO::PARAM_INT);
    $stmt->execute();
    $models = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['models' => $models, 'manufacturer_id' => $manufacturerId], JSON_UNESCAPED_UNICODE);
}

// ============================================================
// 3) Varyant (KType) listesi — modele göre
//    catalog_vehicles, motor bilgisiyle zenginleştirilir
// ============================================================
function tecdoc_vehicles($pdo) {
    $modelId = (int)($_GET['model_id'] ?? 0);
    if ($modelId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'model_id parametresi gerekli']);
        return;
    }

    // Araç + motor bilgileri tek sorguda
    $stmt = $pdo->prepare("
        SELECT v.id, v.model_id, v.description, v.full_name, v.year_from, v.year_to,
               GROUP_CONCAT(DISTINCT NULLIF(e.code, '') ORDER BY e.code SEPARATOR ', ') AS engine_codes
        FROM catalog_vehicles v
        LEFT JOIN catalog_vehicle_engines ve ON ve.vehicle_id = v.id
        LEFT JOIN catalog_engines e ON e.id = ve.engine_id
        WHERE v.model_id = :mid AND v.can_be_displayed = 1
        GROUP BY v.id, v.model_id, v.description, v.full_name, v.year_from, v.year_to
        ORDER BY v.year_from DESC, v.description
    ");
    $stmt->bindValue(':mid', $modelId, PDO::PARAM_INT);
    $stmt->execute();
    $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Tip dönüşümü — yıl alanları null/int olarak temiz dönsün
    foreach ($vehicles as &$v) {
        $v['id']         = (int)$v['id'];
        $v['model_id']   = (int)$v['model_id'];
        $v['year_from']  = $v['year_from'] !== null ? (int)$v['year_from'] : null;
        $v['year_to']    = $v['year_to']   !== null ? (int)$v['year_to']   : null;
    }
    echo json_encode(['vehicles' => $vehicles, 'model_id' => $modelId], JSON_UNESCAPED_UNICODE);
}

// ============================================================
// 4) Araca ait teknik özellikler (attributes)
// ============================================================
function tecdoc_vehicle_attributes($pdo) {
    $vehicleId = (int)($_GET['vehicle_id'] ?? 0);
    if ($vehicleId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'vehicle_id parametresi gerekli']);
        return;
    }
    $stmt = $pdo->prepare("
        SELECT attribute_group, attribute_type, display_title, display_value
        FROM catalog_vehicle_attributes
        WHERE vehicle_id = :vid
        ORDER BY attribute_group, attribute_type
    ");
    $stmt->bindValue(':vid', $vehicleId, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Grupla (UI için kolaylaştır)
    $grouped = [];
    foreach ($rows as $r) {
        $g = $r['attribute_group'] ?: 'Genel';
        if (!isset($grouped[$g])) $grouped[$g] = [];
        $grouped[$g][] = [
            'title' => $r['display_title'],
            'value' => $r['display_value'],
        ];
    }
    echo json_encode([
        'vehicle_id' => $vehicleId,
        'groups' => $grouped,
    ], JSON_UNESCAPED_UNICODE);
}

// ============================================================
// 5) Araca uyan parça kategorileri
// ============================================================
function tecdoc_vehicle_categories($pdo) {
    $vehicleId = (int)($_GET['vehicle_id'] ?? 0);
    if ($vehicleId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'vehicle_id parametresi gerekli']);
        return;
    }
    // catalog_part_vehicles 78M satır — vehicle_id index'i SART (migration ile eklendi)
    $stmt = $pdo->prepare("
        SELECT c.id,
               c.assembly_group_tr,
               c.assembly_group_en,
               c.description_tr,
               c.description_en,
               COUNT(DISTINCT pv.part_id) AS part_count
        FROM catalog_part_vehicles pv
        JOIN catalog_categories c ON c.id = pv.category_id
        WHERE pv.vehicle_id = :vid
        GROUP BY c.id, c.assembly_group_tr, c.assembly_group_en, c.description_tr, c.description_en
        ORDER BY c.assembly_group_tr, c.description_tr
    ");
    $stmt->bindValue(':vid', $vehicleId, PDO::PARAM_INT);
    $stmt->execute();
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Üst grup bazında topla (UI'da assembly_group altına nest et)
    $tree = [];
    foreach ($categories as $c) {
        $group = $c['assembly_group_tr'] ?: $c['assembly_group_en'] ?: 'Diğer';
        if (!isset($tree[$group])) $tree[$group] = [];
        $tree[$group][] = [
            'id'             => (int)$c['id'],
            'description_tr' => $c['description_tr'],
            'description_en' => $c['description_en'],
            'part_count'     => (int)$c['part_count'],
        ];
    }
    echo json_encode([
        'vehicle_id' => $vehicleId,
        'tree' => $tree,
        'flat' => $categories,
    ], JSON_UNESCAPED_UNICODE);
}

// ============================================================
// 6) Araca + kategoriye uyan parçalar
// ============================================================
function tecdoc_vehicle_parts($pdo) {
    $vehicleId  = (int)($_GET['vehicle_id'] ?? 0);
    $categoryId = (int)($_GET['category_id'] ?? 0);
    $page       = max(1, (int)($_GET['page'] ?? 1));
    $limit      = min(200, max(10, (int)($_GET['limit'] ?? 50)));
    $offset     = ($page - 1) * $limit;

    if ($vehicleId <= 0 || $categoryId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'vehicle_id ve category_id parametreleri gerekli']);
        return;
    }

    // Toplam sayı (sayfalama için)
    $cnt = $pdo->prepare("
        SELECT COUNT(DISTINCT pv.part_id)
        FROM catalog_part_vehicles pv
        WHERE pv.vehicle_id = :vid AND pv.category_id = :cid
    ");
    $cnt->bindValue(':vid', $vehicleId, PDO::PARAM_INT);
    $cnt->bindValue(':cid', $categoryId, PDO::PARAM_INT);
    $cnt->execute();
    $total = (int)$cnt->fetchColumn();

    // Parça listesi
    $stmt = $pdo->prepare("
        SELECT p.id, p.supplier_id, p.part_number,
               s.name AS supplier_name,
               s.matchcode AS supplier_matchcode
        FROM catalog_part_vehicles pv
        JOIN catalog_parts p ON p.id = pv.part_id
        LEFT JOIN catalog_suppliers s ON s.id = p.supplier_id
        WHERE pv.vehicle_id = :vid AND pv.category_id = :cid
        GROUP BY p.id, p.supplier_id, p.part_number, s.name, s.matchcode
        ORDER BY s.name, p.part_number
        LIMIT :lim OFFSET :off
    ");
    $stmt->bindValue(':vid', $vehicleId, PDO::PARAM_INT);
    $stmt->bindValue(':cid', $categoryId, PDO::PARAM_INT);
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $parts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Görselleri toplu al — önce gerçekten yüklü olanlar (part_images.file_path),
    // sonra TecDoc katalogda bilinen ama henüz upload edilmeyenler (catalog_part_images.picture_name)
    if (!empty($parts)) {
        $pairs = [];
        $values = [];
        $i = 0;
        foreach ($parts as $p) {
            $pairs[] = "(:s$i, :n$i)";
            $values[":s$i"] = (int)$p['supplier_id'];
            $values[":n$i"] = $p['part_number'];
            $i++;
        }
        $whereIn = "(supplier_id, part_number) IN (" . implode(',', $pairs) . ")";

        // 1) Gerçekten yüklenmiş görseller (file_path dolu)
        $imgMap = [];
        try {
            $imgSql = "SELECT supplier_id, part_number, file_path, picture_name, doc_type
                       FROM part_images
                       WHERE $whereIn AND uploaded = 1 AND file_path IS NOT NULL AND file_path <> ''
                       ORDER BY doc_type DESC, picture_name";
            $imgStmt = $pdo->prepare($imgSql);
            foreach ($values as $k => $v) {
                $imgStmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
            }
            $imgStmt->execute();
            foreach ($imgStmt->fetchAll(PDO::FETCH_ASSOC) as $img) {
                $key = $img['supplier_id'] . '|' . $img['part_number'];
                if (!isset($imgMap[$key])) $imgMap[$key] = [];
                $imgMap[$key][] = [
                    'url'  => '/uploads/' . ltrim($img['file_path'], '/'),
                    'name' => $img['picture_name'] ?? null,
                    'type' => $img['doc_type'] ?? 'Picture',
                ];
            }
        } catch (PDOException $e) { /* part_images yoksa atla */ }

        // 2) TecDoc kataloğunda var ama upload edilmemiş — fallback isim listesi
        try {
            $imgSql2 = "SELECT supplier_id, part_number, picture_name, doc_type
                        FROM catalog_part_images
                        WHERE $whereIn
                        ORDER BY doc_type DESC, picture_name";
            $imgStmt2 = $pdo->prepare($imgSql2);
            foreach ($values as $k => $v) {
                $imgStmt2->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
            }
            $imgStmt2->execute();
            foreach ($imgStmt2->fetchAll(PDO::FETCH_ASSOC) as $img) {
                $key = $img['supplier_id'] . '|' . $img['part_number'];
                if (!isset($imgMap[$key])) $imgMap[$key] = [];
                // Sadece daha önce eklenmemiş bir picture_name ise ekle (uploaded olanı tercih et)
                $alreadyHas = false;
                foreach ($imgMap[$key] as $existing) {
                    if (($existing['name'] ?? null) === $img['picture_name']) { $alreadyHas = true; break; }
                }
                if (!$alreadyHas) {
                    $imgMap[$key][] = [
                        'url'  => null, // upload edilmediyse görüntülenemez
                        'name' => $img['picture_name'],
                        'type' => $img['doc_type'] ?? 'Picture',
                    ];
                }
            }
        } catch (PDOException $e) { /* catalog_part_images yoksa atla */ }

        // Parçalara ekle
        foreach ($parts as &$p) {
            $key = $p['supplier_id'] . '|' . $p['part_number'];
            $p['id']           = (int)$p['id'];
            $p['supplier_id']  = (int)$p['supplier_id'];
            $imgs              = $imgMap[$key] ?? [];
            $p['images']       = $imgs;
            // İlk yüklenmiş görselin URL'i (kart kapağı)
            $p['cover_url'] = null;
            foreach ($imgs as $img) {
                if (!empty($img['url'])) { $p['cover_url'] = $img['url']; break; }
            }
        }
        unset($p);
    }

    echo json_encode([
        'vehicle_id'  => $vehicleId,
        'category_id' => $categoryId,
        'parts'       => $parts,
        'page'        => $page,
        'limit'       => $limit,
        'total'       => $total,
        'has_more'    => ($offset + $limit) < $total,
    ], JSON_UNESCAPED_UNICODE);
}

// ============================================================
// 7) OEM/parça numarası ile arama (TecDoc)
// ============================================================
function tecdoc_search($pdo) {
    $q = trim($_GET['q'] ?? '');
    if (mb_strlen($q) < 3) {
        http_response_code(400);
        echo json_encode(['error' => 'En az 3 karakter girin', 'results' => []]);
        return;
    }
    // Önce exact match, sonra prefix
    $exact = $pdo->prepare("
        SELECT p.id, p.supplier_id, p.part_number, s.name AS supplier_name
        FROM catalog_parts p
        LEFT JOIN catalog_suppliers s ON s.id = p.supplier_id
        WHERE p.part_number = :q
        LIMIT 50
    ");
    $exact->bindValue(':q', $q, PDO::PARAM_STR);
    $exact->execute();
    $results = $exact->fetchAll(PDO::FETCH_ASSOC);

    if (count($results) < 50) {
        $like = $pdo->prepare("
            SELECT p.id, p.supplier_id, p.part_number, s.name AS supplier_name
            FROM catalog_parts p
            LEFT JOIN catalog_suppliers s ON s.id = p.supplier_id
            WHERE p.part_number LIKE :q AND p.part_number != :exact
            ORDER BY LENGTH(p.part_number), p.part_number
            LIMIT :lim
        ");
        $like->bindValue(':q', $q . '%', PDO::PARAM_STR);
        $like->bindValue(':exact', $q, PDO::PARAM_STR);
        $like->bindValue(':lim', 50 - count($results), PDO::PARAM_INT);
        $like->execute();
        $results = array_merge($results, $like->fetchAll(PDO::FETCH_ASSOC));
    }

    foreach ($results as &$r) {
        $r['id']          = (int)$r['id'];
        $r['supplier_id'] = (int)$r['supplier_id'];
    }

    echo json_encode(['query' => $q, 'results' => $results], JSON_UNESCAPED_UNICODE);
}

// ============================================================
// 8) Parça detayı + uyumlu araçlar + cross-ref
// ============================================================
function tecdoc_part_detail($pdo) {
    $partId = (int)($_GET['part_id'] ?? 0);
    if ($partId <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'part_id parametresi gerekli']);
        return;
    }
    // Parça
    $stmt = $pdo->prepare("
        SELECT p.id, p.supplier_id, p.part_number,
               s.name AS supplier_name, s.matchcode AS supplier_matchcode
        FROM catalog_parts p
        LEFT JOIN catalog_suppliers s ON s.id = p.supplier_id
        WHERE p.id = :pid
    ");
    $stmt->bindValue(':pid', $partId, PDO::PARAM_INT);
    $stmt->execute();
    $part = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$part) {
        http_response_code(404);
        echo json_encode(['error' => 'Parça bulunamadı']);
        return;
    }
    $part['id']          = (int)$part['id'];
    $part['supplier_id'] = (int)$part['supplier_id'];

    // Görseller
    $imgs = $pdo->prepare("
        SELECT picture_name, doc_type
        FROM catalog_part_images
        WHERE supplier_id = :sid AND part_number = :pn
        ORDER BY doc_type DESC, picture_name
    ");
    $imgs->bindValue(':sid', $part['supplier_id'], PDO::PARAM_INT);
    $imgs->bindValue(':pn',  $part['part_number'], PDO::PARAM_STR);
    $imgs->execute();
    $part['images'] = $imgs->fetchAll(PDO::FETCH_ASSOC);

    // Cross-references (muadiller)
    $cross = $pdo->prepare("
        SELECT cr.ref_supplier_id, cr.ref_part_number, cr.ref_type,
               s.name AS ref_supplier_name
        FROM catalog_cross_ref cr
        LEFT JOIN catalog_suppliers s ON s.id = cr.ref_supplier_id
        WHERE cr.supplier_id = :sid AND cr.part_number = :pn
        LIMIT 100
    ");
    $cross->bindValue(':sid', $part['supplier_id'], PDO::PARAM_INT);
    $cross->bindValue(':pn',  $part['part_number'], PDO::PARAM_STR);
    $cross->execute();
    $part['cross_references'] = $cross->fetchAll(PDO::FETCH_ASSOC);

    // Uyumlu araçlar (limitli — full liste için ayrı endpoint)
    $veh = $pdo->prepare("
        SELECT DISTINCT v.id, v.description, v.year_from, v.year_to,
               m.name AS model_name, mf.name AS manufacturer_name
        FROM catalog_part_vehicles pv
        JOIN catalog_vehicles v ON v.id = pv.vehicle_id
        JOIN catalog_models m ON m.id = v.model_id
        JOIN catalog_manufacturers mf ON mf.id = m.manufacturer_id
        WHERE pv.part_id = :pid
        ORDER BY mf.name, m.name, v.year_from DESC
        LIMIT 100
    ");
    $veh->bindValue(':pid', $partId, PDO::PARAM_INT);
    $veh->execute();
    $part['compatible_vehicles'] = $veh->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['part' => $part], JSON_UNESCAPED_UNICODE);
}
