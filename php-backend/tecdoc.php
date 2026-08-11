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

