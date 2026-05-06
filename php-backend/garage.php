<?php
/**
 * garage.php — Garaj ve bakım takip fonksiyonları
 * ensure_garage_columns, handle_garage_list, handle_garage_add,
 * handle_garage_remove, handle_garage_update, handle_maintenance_list,
 * handle_maintenance_add, handle_maintenance_update, handle_maintenance_remove
 *
 * Bağımlılık: auth.php (get_auth_user_id)
 */

// ==================== Garage Helpers ====================

/**
 * garage tablosundaki opsiyonel kolonlari kontrol eder, eksikleri ALTER TABLE ile ekler.
 * Donen dizi: ['spec_id' => bool, 'plaka' => bool, 'sase_no' => bool]
 */
function ensure_garage_columns($pdo): array {
    $cols = [
        'spec_id'           => false,
        'plaka'             => false,
        'sase_no'           => false,
        'manufacturer_id'   => false,
        'model_id'          => false,
        'vehicle_id_ktype'  => false,
        'model_name'        => false,
    ];
    try {
        $existing = $pdo->query("SHOW COLUMNS FROM garage")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($cols as $name => $_) {
            $cols[$name] = in_array($name, $existing, true);
        }
    } catch (PDOException $e) {}

    // Eski opsiyonel kolonlar
    if (!$cols['plaka']) {
        try { $pdo->exec("ALTER TABLE garage ADD COLUMN plaka VARCHAR(20) DEFAULT NULL"); $cols['plaka'] = true; } catch (PDOException $e) {}
    }
    if (!$cols['sase_no']) {
        try { $pdo->exec("ALTER TABLE garage ADD COLUMN sase_no VARCHAR(50) DEFAULT NULL"); $cols['sase_no'] = true; } catch (PDOException $e) {}
    }
    // TecDoc ID kolonları (Faz 3.2)
    if (!$cols['manufacturer_id']) {
        try { $pdo->exec("ALTER TABLE garage ADD COLUMN manufacturer_id INT UNSIGNED DEFAULT NULL"); $cols['manufacturer_id'] = true; } catch (PDOException $e) {}
    }
    if (!$cols['model_id']) {
        try { $pdo->exec("ALTER TABLE garage ADD COLUMN model_id INT UNSIGNED DEFAULT NULL"); $cols['model_id'] = true; } catch (PDOException $e) {}
    }
    if (!$cols['vehicle_id_ktype']) {
        try { $pdo->exec("ALTER TABLE garage ADD COLUMN vehicle_id_ktype INT UNSIGNED DEFAULT NULL, ADD INDEX idx_ktype (vehicle_id_ktype)"); $cols['vehicle_id_ktype'] = true; } catch (PDOException $e) {}
    }
    if (!$cols['model_name']) {
        try { $pdo->exec("ALTER TABLE garage ADD COLUMN model_name VARCHAR(200) DEFAULT NULL"); $cols['model_name'] = true; } catch (PDOException $e) {}
    }

    return $cols;
}

// ==================== Garage Handlers ====================

function handle_garage_list($pdo) {
    try {
        $user_id = get_auth_user_id();
        if (!$user_id) { http_response_code(401); echo json_encode(['error' => 'Oturum gecersiz']); return; }

        // Opsiyonel kolonlari kontrol et ve eksikleri ekle
        $garageCols = ensure_garage_columns($pdo);
        $hasSpecId  = $garageCols['spec_id'];
        $hasPlaka   = $garageCols['plaka'];
        $hasSaseNo  = $garageCols['sase_no'];

        $cols = 'id, brand_slug, brand_name, generation_slug, generation_name, year, nickname, current_km, km_updated_at, notes, created_at';
        if ($hasSpecId) $cols .= ', spec_id';
        if ($hasPlaka) $cols .= ', plaka';
        if ($hasSaseNo) $cols .= ', sase_no';
        if ($garageCols['manufacturer_id'])  $cols .= ', manufacturer_id';
        if ($garageCols['model_id'])         $cols .= ', model_id';
        if ($garageCols['vehicle_id_ktype']) $cols .= ', vehicle_id_ktype';
        if ($garageCols['model_name'])       $cols .= ', model_name';
        $stmt = $pdo->prepare("SELECT $cols FROM garage WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user_id]);
        $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Tüm bakım kayıtlarını tek sorguda çek (N+1 sorgu yerine)
        $vehicleIds = array_column($vehicles, 'id');
        $maintenanceByVehicle = [];
        if (!empty($vehicleIds)) {
            $placeholders = implode(',', array_fill(0, count($vehicleIds), '?'));
            $mstmt = $pdo->prepare("SELECT garage_id, next_km, next_date FROM vehicle_maintenance WHERE user_id = ? AND garage_id IN ($placeholders)");
            $mstmt->execute(array_merge([$user_id], $vehicleIds));
            foreach ($mstmt->fetchAll(PDO::FETCH_ASSOC) as $m) {
                $maintenanceByVehicle[$m['garage_id']][] = $m;
            }
        }

        $today = date('Y-m-d');
        $upcoming_cutoff = date('Y-m-d', strtotime('+30 days'));
        foreach ($vehicles as &$v) {
            $v['id'] = (int)$v['id'];
            $v['year'] = $v['year'] !== null ? (int)$v['year'] : null;
            $v['current_km'] = $v['current_km'] !== null ? (int)$v['current_km'] : null;
            $v['spec_id'] = isset($v['spec_id']) && $v['spec_id'] !== null ? (int)$v['spec_id'] : null;
            if (!isset($v['plaka'])) $v['plaka'] = null;
            if (!isset($v['sase_no'])) $v['sase_no'] = null;

            $maintenances = $maintenanceByVehicle[$v['id']] ?? [];
            $overdue = 0; $upcoming = 0;
            foreach ($maintenances as $m) {
                $km_overdue = ($m['next_km'] !== null && $v['current_km'] !== null && (int)$m['next_km'] <= $v['current_km']);
                $date_overdue = ($m['next_date'] !== null && $m['next_date'] <= $today);
                $km_upcoming = ($m['next_km'] !== null && $v['current_km'] !== null && !$km_overdue && ((int)$m['next_km'] - $v['current_km'] <= 1000));
                $date_upcoming = ($m['next_date'] !== null && !$date_overdue && $m['next_date'] <= $upcoming_cutoff);

                if ($km_overdue || $date_overdue) { $overdue++; }
                elseif ($km_upcoming || $date_upcoming) { $upcoming++; }
            }
            $v['overdue_count'] = $overdue;
            $v['upcoming_count'] = $upcoming;
            $v['total_maintenance'] = count($maintenances);
        }
        echo json_encode(['vehicles' => $vehicles]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Garaj listesi alinamadi: ' . $e->getMessage());
        echo json_encode(['error' => 'Garaj bilgileri yüklenirken bir hata oluştu.']);
    }
}

function handle_garage_add($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    try {
        $user_id = get_auth_user_id();
        if (!$user_id) { http_response_code(401); echo json_encode(['error' => 'Oturum gecersiz']); return; }

        // Opsiyonel kolonlari kontrol et ve eksikleri ekle
        $garageCols = ensure_garage_columns($pdo);

        // ── TecDoc ID payload (Faz 3.2 yeni yol) ──
        $manufacturer_id  = isset($_POST['manufacturer_id'])  && $_POST['manufacturer_id']  !== '' ? intval($_POST['manufacturer_id'])  : null;
        $model_id         = isset($_POST['model_id'])         && $_POST['model_id']         !== '' ? intval($_POST['model_id'])         : null;
        $vehicle_id_ktype = isset($_POST['vehicle_id_ktype']) && $_POST['vehicle_id_ktype'] !== '' ? intval($_POST['vehicle_id_ktype']) : null;
        $model_name_in    = trim($_POST['model_name'] ?? '');

        // ── Eski slug payload (geriye uyum) ──
        $brand_slug      = trim($_POST['brand_slug']      ?? '');
        $brand_name      = trim($_POST['brand_name']      ?? '');
        $generation_slug = trim($_POST['generation_slug'] ?? '');
        $generation_name = trim($_POST['generation_name'] ?? '');
        $nickname        = trim($_POST['nickname']        ?? '');
        $year            = isset($_POST['year']) && $_POST['year'] !== '' ? intval($_POST['year']) : null;

        // İki yoldan biri zorunlu
        $isTecDocPayload = $manufacturer_id && $model_id && $vehicle_id_ktype;
        $isLegacyPayload = $brand_slug && $brand_name && $generation_slug && $generation_name;
        if (!$isTecDocPayload && !$isLegacyPayload) {
            http_response_code(400);
            echo json_encode(['error' => 'TecDoc ID (manufacturer_id, model_id, vehicle_id_ktype) veya slug seti (brand_slug, brand_name, generation_slug, generation_name) zorunludur']);
            return;
        }

        // TecDoc payload geldiyse slug alanlarını türet (uniqueness ve eski UI uyumluluğu için)
        if ($isTecDocPayload && !$isLegacyPayload) {
            $brand_slug      = $brand_slug      ?: ('tecdoc-mfr-' . $manufacturer_id);
            $brand_name      = $brand_name      ?: ('Marka #' . $manufacturer_id);
            $generation_slug = $generation_slug ?: ('tecdoc-ktype-' . $vehicle_id_ktype);
            $generation_name = $generation_name ?: ($model_name_in ?: ('KType ' . $vehicle_id_ktype));
        }

        // Duplicate kontrol: TecDoc varsa ktype ile, yoksa slug ile
        if ($isTecDocPayload && $garageCols['vehicle_id_ktype']) {
            $check = $pdo->prepare('SELECT id FROM garage WHERE user_id = ? AND vehicle_id_ktype = ?');
            $check->execute([$user_id, $vehicle_id_ktype]);
        } else {
            $check = $pdo->prepare('SELECT id FROM garage WHERE user_id = ? AND brand_slug = ? AND generation_slug = ?');
            $check->execute([$user_id, $brand_slug, $generation_slug]);
        }
        if ($check->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Bu araç zaten garajınızda kayıtlı']);
            return;
        }

        $spec_id = isset($_POST['spec_id']) && $_POST['spec_id'] !== '' ? intval($_POST['spec_id']) : null;
        $plaka   = isset($_POST['plaka'])   && trim($_POST['plaka'])   !== '' ? strtoupper(trim($_POST['plaka']))   : null;
        $sase_no = isset($_POST['sase_no']) && trim($_POST['sase_no']) !== '' ? strtoupper(trim($_POST['sase_no'])) : null;

        $insertCols = ['user_id', 'brand_slug', 'brand_name', 'generation_slug', 'generation_name', 'year', 'nickname'];
        $insertVals = [$user_id, $brand_slug, $brand_name, $generation_slug, $generation_name, $year, $nickname ?: null];
        if ($garageCols['spec_id'])          { $insertCols[] = 'spec_id';           $insertVals[] = $spec_id; }
        if ($garageCols['plaka'])            { $insertCols[] = 'plaka';             $insertVals[] = $plaka; }
        if ($garageCols['sase_no'])          { $insertCols[] = 'sase_no';           $insertVals[] = $sase_no; }
        if ($garageCols['manufacturer_id'])  { $insertCols[] = 'manufacturer_id';   $insertVals[] = $manufacturer_id; }
        if ($garageCols['model_id'])         { $insertCols[] = 'model_id';          $insertVals[] = $model_id; }
        if ($garageCols['vehicle_id_ktype']) { $insertCols[] = 'vehicle_id_ktype';  $insertVals[] = $vehicle_id_ktype; }
        if ($garageCols['model_name'])       { $insertCols[] = 'model_name';        $insertVals[] = ($model_name_in ?: null); }

        $placeholders = implode(', ', array_fill(0, count($insertCols), '?'));
        $stmt = $pdo->prepare('INSERT INTO garage (' . implode(', ', $insertCols) . ') VALUES (' . $placeholders . ')');
        $stmt->execute($insertVals);
        $new_id = (int)$pdo->lastInsertId();

        echo json_encode(['success' => true, 'id' => $new_id]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Arac eklenemedi: ' . $e->getMessage());
        echo json_encode(['error' => 'Araç eklenirken bir hata oluştu.']);
    }
}

function handle_garage_remove($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    try {
        $user_id = get_auth_user_id();
        if (!$user_id) { http_response_code(401); echo json_encode(['error' => 'Oturum gecersiz']); return; }

        $id = intval($_POST['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'id zorunludur']); return; }

        $stmt = $pdo->prepare('DELETE FROM garage WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user_id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Arac bulunamadi veya bu isleme yetkiniz yok']);
            return;
        }

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Arac silinemedi: ' . $e->getMessage());
        echo json_encode(['error' => 'Araç silinirken bir hata oluştu.']);
    }
}

function handle_garage_update($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    try {
        $user_id = get_auth_user_id();
        if (!$user_id) { http_response_code(401); echo json_encode(['error' => 'Oturum gecersiz']); return; }

        $id = intval($_POST['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'id zorunludur']); return; }

        // Ownership check
        $check = $pdo->prepare('SELECT id FROM garage WHERE id = ? AND user_id = ?');
        $check->execute([$id, $user_id]);
        if (!$check->fetch()) { http_response_code(404); echo json_encode(['error' => 'Arac bulunamadi']); return; }

        $updates = []; $params = [];
        if (isset($_POST['nickname'])) { $updates[] = 'nickname = ?'; $params[] = trim($_POST['nickname']) ?: null; }
        if (isset($_POST['notes'])) { $updates[] = 'notes = ?'; $params[] = trim($_POST['notes']) ?: null; }
        if (isset($_POST['current_km']) && $_POST['current_km'] !== '') {
            $updates[] = 'current_km = ?'; $params[] = intval($_POST['current_km']);
            $updates[] = 'km_updated_at = NOW()';
        }
        if (isset($_POST['plaka'])) { $updates[] = 'plaka = ?'; $params[] = trim($_POST['plaka']) !== '' ? strtoupper(trim($_POST['plaka'])) : null; }
        if (isset($_POST['sase_no'])) { $updates[] = 'sase_no = ?'; $params[] = trim($_POST['sase_no']) !== '' ? strtoupper(trim($_POST['sase_no'])) : null; }

        if (empty($updates)) { echo json_encode(['success' => true]); return; }

        $params[] = $id; $params[] = $user_id;
        $pdo->prepare('UPDATE garage SET ' . implode(', ', $updates) . ' WHERE id = ? AND user_id = ?')->execute($params);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Guncelleme hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'Güncelleme sırasında bir hata oluştu.']);
    }
}

function handle_maintenance_list($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    try {
        $user_id = get_auth_user_id();
        if (!$user_id) { http_response_code(401); echo json_encode(['error' => 'Oturum gecersiz']); return; }

        $garage_id = intval($_POST['garage_id'] ?? 0);
        if (!$garage_id) { http_response_code(400); echo json_encode(['error' => 'garage_id zorunludur']); return; }

        // Ownership check
        $check = $pdo->prepare('SELECT id FROM garage WHERE id = ? AND user_id = ?');
        $check->execute([$garage_id, $user_id]);
        if (!$check->fetch()) { http_response_code(404); echo json_encode(['error' => 'Arac bulunamadi']); return; }

        $stmt = $pdo->prepare('SELECT id, garage_id, maintenance_type, done_km, done_date, next_km, next_date, notes, created_at FROM vehicle_maintenance WHERE garage_id = ? AND user_id = ? ORDER BY done_date DESC, created_at DESC');
        $stmt->execute([$garage_id, $user_id]);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($records as &$r) {
            $r['id'] = (int)$r['id'];
            $r['garage_id'] = (int)$r['garage_id'];
            $r['done_km'] = $r['done_km'] !== null ? (int)$r['done_km'] : null;
            $r['next_km'] = $r['next_km'] !== null ? (int)$r['next_km'] : null;
        }
        echo json_encode(['records' => $records]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Bakim listesi alinamadi: ' . $e->getMessage());
        echo json_encode(['error' => 'Bakım bilgileri yüklenirken bir hata oluştu.']);
    }
}

function handle_maintenance_add($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    try {
        $user_id = get_auth_user_id();
        if (!$user_id) { http_response_code(401); echo json_encode(['error' => 'Oturum gecersiz']); return; }

        $garage_id = intval($_POST['garage_id'] ?? 0);
        $maintenance_type = trim($_POST['maintenance_type'] ?? '');
        if (!$garage_id || !$maintenance_type) { http_response_code(400); echo json_encode(['error' => 'garage_id ve maintenance_type zorunludur']); return; }

        // Ownership check
        $check = $pdo->prepare('SELECT id FROM garage WHERE id = ? AND user_id = ?');
        $check->execute([$garage_id, $user_id]);
        if (!$check->fetch()) { http_response_code(404); echo json_encode(['error' => 'Arac bulunamadi']); return; }

        $done_km = isset($_POST['done_km']) && $_POST['done_km'] !== '' ? intval($_POST['done_km']) : null;
        $done_date = isset($_POST['done_date']) && $_POST['done_date'] !== '' ? $_POST['done_date'] : null;
        $next_km = isset($_POST['next_km']) && $_POST['next_km'] !== '' ? intval($_POST['next_km']) : null;
        $next_date = isset($_POST['next_date']) && $_POST['next_date'] !== '' ? $_POST['next_date'] : null;
        $notes = isset($_POST['notes']) && trim($_POST['notes']) !== '' ? trim($_POST['notes']) : null;

        $stmt = $pdo->prepare('INSERT INTO vehicle_maintenance (garage_id, user_id, maintenance_type, done_km, done_date, next_km, next_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$garage_id, $user_id, $maintenance_type, $done_km, $done_date, $next_km, $next_date, $notes]);
        $new_id = (int)$pdo->lastInsertId();

        echo json_encode(['success' => true, 'id' => $new_id]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Bakim eklenemedi: ' . $e->getMessage());
        echo json_encode(['error' => 'Bakım kaydı eklenirken bir hata oluştu.']);
    }
}

function handle_maintenance_update($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    try {
        $user_id = get_auth_user_id();
        if (!$user_id) { http_response_code(401); echo json_encode(['error' => 'Oturum gecersiz']); return; }

        $id = intval($_POST['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'id zorunludur']); return; }

        // Ownership check
        $check = $pdo->prepare('SELECT id FROM vehicle_maintenance WHERE id = ? AND user_id = ?');
        $check->execute([$id, $user_id]);
        if (!$check->fetch()) { http_response_code(404); echo json_encode(['error' => 'Bakim kaydi bulunamadi']); return; }

        $updates = []; $params = [];
        if (isset($_POST['maintenance_type'])) { $updates[] = 'maintenance_type = ?'; $params[] = trim($_POST['maintenance_type']); }
        if (isset($_POST['done_km'])) { $updates[] = 'done_km = ?'; $params[] = $_POST['done_km'] !== '' ? intval($_POST['done_km']) : null; }
        if (isset($_POST['done_date'])) { $updates[] = 'done_date = ?'; $params[] = $_POST['done_date'] !== '' ? $_POST['done_date'] : null; }
        if (isset($_POST['next_km'])) { $updates[] = 'next_km = ?'; $params[] = $_POST['next_km'] !== '' ? intval($_POST['next_km']) : null; }
        if (isset($_POST['next_date'])) { $updates[] = 'next_date = ?'; $params[] = $_POST['next_date'] !== '' ? $_POST['next_date'] : null; }
        if (isset($_POST['notes'])) { $updates[] = 'notes = ?'; $params[] = trim($_POST['notes']) ?: null; }

        if (empty($updates)) { echo json_encode(['success' => true]); return; }

        $params[] = $id; $params[] = $user_id;
        $pdo->prepare('UPDATE vehicle_maintenance SET ' . implode(', ', $updates) . ' WHERE id = ? AND user_id = ?')->execute($params);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Bakim guncellenemedi: ' . $e->getMessage());
        echo json_encode(['error' => 'Bakım kaydı güncellenirken bir hata oluştu.']);
    }
}

function handle_maintenance_remove($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    try {
        $user_id = get_auth_user_id();
        if (!$user_id) { http_response_code(401); echo json_encode(['error' => 'Oturum gecersiz']); return; }

        $id = intval($_POST['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'id zorunludur']); return; }

        $stmt = $pdo->prepare('DELETE FROM vehicle_maintenance WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $user_id]);
        if ($stmt->rowCount() === 0) { http_response_code(404); echo json_encode(['error' => 'Bakim kaydi bulunamadi']); return; }

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Bakim silinemedi: ' . $e->getMessage());
        echo json_encode(['error' => 'Bakım kaydı silinirken bir hata oluştu.']);
    }
}
