<?php
// Global error handler — tüm hataları JSON olarak döndür
set_error_handler(function($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});
set_exception_handler(function($e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'PHP Hata: ' . $e->getMessage() . ' (satir ' . $e->getLine() . ')']);
    exit;
});

header('Access-Control-Allow-Origin: https://parcabizden.com.tr');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// ==================== JWT & Auth Constants ====================
define('JWT_SECRET', 'pBzD_s3cr3t_k3y_2024_xK9mP2vL8nQ4wR7j');
define('JWT_EXPIRY', 86400); // 24 hours

$DB_HOST = 'localhost';
$DB_NAME = 'u2547422_parcabizden';
$DB_USER = 'u2547422_uorta';
$DB_PASS = 'iR?]gvlh+l[AB_r2';

header('Content-Type: application/json; charset=utf-8');
$action_check = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');
$auth_actions = ['register', 'login', 'profile', 'verify_email', 'resend_verify', 'forgot_password', 'reset_password'];
if (in_array($action_check, $auth_actions)) {
    header('Cache-Control: no-store, no-cache, must-revalidate');
} else {
    header('Cache-Control: public, max-age=3600');
}

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed']);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');
switch ($action) {
    case 'categories':    get_categories($pdo); break;
    case 'nodes':         get_nodes($pdo); break;
    case 'parts':         get_parts($pdo); break;
    case 'search_oem':    search_oem($pdo); break;
    case 'vin_decode':    vin_decode($pdo); break;
    case 'brands':        get_brands($pdo); break;
    case 'generations':   get_generations($pdo); break;
    case 'chat':          handle_chat($pdo); break;
    case 'chat_messages': handle_chat_messages($pdo); break;
    case 'chat_webhook':  handle_chat_webhook($pdo); break;
    case 'register':      handle_register($pdo); break;
    case 'login':         handle_login($pdo); break;
    case 'profile':       handle_profile($pdo); break;
    case 'verify_email':  handle_verify_email($pdo); break;
    case 'resend_verify':   handle_resend_verify($pdo); break;
    case 'forgot_password': handle_forgot_password($pdo); break;
    case 'reset_password':  handle_reset_password($pdo); break;
    default: echo json_encode(['error' => 'Invalid action']);
}

function clean_text($text) {
    if (!$text) return '';
    $text = preg_replace('/<br\s*\/?>/i', ' ', $text);
    $text = strip_tags($text);
    $text = preg_replace('/\s+/', ' ', $text);
    return trim($text);
}

function format_gen_slug($slug) {
    if (!$slug) return '';
    $parts = explode('-', $slug);
    $formatted = [];
    foreach ($parts as $p) {
        if (strtolower($p) === 'typ' || strtolower($p) === 'type') continue;
        $formatted[] = strtoupper($p);
    }
    return implode(' ', $formatted);
}

function get_categories($pdo) {
    $gen = isset($_GET['gen']) ? $_GET['gen'] : '';
    $brand = isset($_GET['brand']) ? $_GET['brand'] : '';
    if (!$gen || !$brand) { echo json_encode(['error' => 'gen and brand required']); return; }

    $stmt = $pdo->prepare("SELECT p.node_name_en, COUNT(DISTINCT p.oem_number) as part_count FROM parts p WHERE p.generation_slug = :gen AND p.brand_slug = :brand AND p.node_name_en IS NOT NULL AND p.node_name_en != '' GROUP BY p.node_name_en");
    $stmt->execute([':gen' => $gen, ':brand' => $brand]);
    $nodes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $nc_stmt = $pdo->query("SELECT node_name_en, category_id FROM node_categories");
    $nc_map = [];
    while ($row = $nc_stmt->fetch(PDO::FETCH_ASSOC)) { $nc_map[$row['node_name_en']] = $row['category_id']; }

    $cats_stmt = $pdo->query("SELECT * FROM categories ORDER BY sort_order");
    $cats = [];
    while ($row = $cats_stmt->fetch(PDO::FETCH_ASSOC)) {
        $cats[$row['id']] = ['id' => $row['id'], 'name_tr' => $row['name_tr'], 'name_en' => $row['name_en'], 'icon' => $row['icon'], 'sort_order' => intval($row['sort_order']), 'total_parts' => 0, 'node_count' => 0];
    }
    $cats['other'] = ['id' => 'other', 'name_tr' => 'Diger', 'name_en' => 'Other', 'icon' => '', 'sort_order' => 999, 'total_parts' => 0, 'node_count' => 0];

    $total_parts = 0;
    foreach ($nodes as $node) {
        $cat_id = isset($nc_map[$node['node_name_en']]) ? $nc_map[$node['node_name_en']] : 'other';
        if (!isset($cats[$cat_id])) $cat_id = 'other';
        $cats[$cat_id]['total_parts'] += intval($node['part_count']);
        $cats[$cat_id]['node_count']++;
        $total_parts += intval($node['part_count']);
    }

    $result = [];
    foreach ($cats as $c) { if ($c['total_parts'] > 0) $result[] = $c; }
    usort($result, function($a, $b) { return $a['sort_order'] - $b['sort_order']; });
    echo json_encode(['categories' => $result, 'total_parts' => $total_parts]);
}

function get_nodes($pdo) {
    $gen = isset($_GET['gen']) ? $_GET['gen'] : '';
    $brand = isset($_GET['brand']) ? $_GET['brand'] : '';
    $cat_id = isset($_GET['cat']) ? $_GET['cat'] : '';
    if (!$gen || !$brand || !$cat_id) { echo json_encode(['error' => 'gen, brand, cat required']); return; }

    if ($cat_id === 'other') {
        $stmt = $pdo->prepare("SELECT p.node_name_en, COUNT(DISTINCT p.oem_number) as part_count FROM parts p LEFT JOIN node_categories nc ON p.node_name_en = nc.node_name_en WHERE p.generation_slug = :gen AND p.brand_slug = :brand AND p.node_name_en IS NOT NULL AND p.node_name_en != '' AND nc.category_id IS NULL GROUP BY p.node_name_en ORDER BY part_count DESC");
        $stmt->execute([':gen' => $gen, ':brand' => $brand]);
    } else {
        $stmt = $pdo->prepare("SELECT p.node_name_en, COUNT(DISTINCT p.oem_number) as part_count FROM parts p INNER JOIN node_categories nc ON p.node_name_en = nc.node_name_en WHERE p.generation_slug = :gen AND p.brand_slug = :brand AND nc.category_id = :cat AND p.node_name_en IS NOT NULL AND p.node_name_en != '' GROUP BY p.node_name_en ORDER BY part_count DESC");
        $stmt->execute([':gen' => $gen, ':brand' => $brand, ':cat' => $cat_id]);
    }

    $tr_map = ['air-filter-with-connecting-parts' => 'Hava Filtresi ve Baglanti Parcalari', 'oil-filter' => 'Yag Filtresi', 'fuel-filter' => 'Yakit Filtresi', 'spark-plug' => 'Buji', 'brake-disc' => 'Fren Diski', 'brake-pad' => 'Fren Balatasi', 'oil-pump' => 'Yag Pompasi', 'water-pump' => 'Su Pompasi', 'alternator' => 'Alternator', 'starter' => 'Mars Motoru', 'radiator' => 'Radyator', 'thermostat' => 'Termostat', 'clutch' => 'Debriyaj', 'shock-absorber' => 'Amortisor', 'headlight' => 'Far', 'tail-light' => 'Stop Lambasi', 'mirror' => 'Ayna', 'wiper' => 'Silecek', 'battery' => 'Aku', 'exhaust-pipe' => 'Egzoz Borusu', 'catalytic-converter' => 'Katalitik Konvertor', 'timing-belt' => 'Triger Kayisi', 'timing-chain' => 'Triger Zinciri', 'cylinder-head' => 'Silindir Kapagi', 'piston' => 'Piston', 'crankshaft' => 'Krank Mili', 'camshaft' => 'Eksantrik Mili', 'turbocharger' => 'Turbo', 'intercooler' => 'Interkuler', 'gearbox' => 'Sanziman'];

    $nodes = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $name_en = $row['node_name_en'];
        $label = isset($tr_map[$name_en]) ? $tr_map[$name_en] : ucwords(str_replace('-', ' ', $name_en));
        $nodes[] = ['name' => $name_en, 'label' => $label, 'part_count' => intval($row['part_count'])];
    }
    echo json_encode(['nodes' => $nodes]);
}

function get_parts($pdo) {
    $gen = isset($_GET['gen']) ? $_GET['gen'] : '';
    $brand = isset($_GET['brand']) ? $_GET['brand'] : '';
    $node = isset($_GET['node']) ? $_GET['node'] : '';
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    if ($page < 1) $page = 1;
    $limit = 50;
    $offset = ($page - 1) * $limit;
    if (!$gen || !$brand || !$node) { echo json_encode(['error' => 'gen, brand, node required']); return; }

    $stmt = $pdo->prepare("SELECT COUNT(DISTINCT oem_number) FROM parts WHERE generation_slug = :gen AND brand_slug = :brand AND node_name_en = :node");
    $stmt->execute([':gen' => $gen, ':brand' => $brand, ':node' => $node]);
    $total = intval($stmt->fetchColumn());

    $stmt2 = $pdo->prepare("SELECT oem_number, MAX(name) as name, GROUP_CONCAT(DISTINCT quantity SEPARATOR ', ') as quantity, GROUP_CONCAT(DISTINCT info SEPARATOR ' | ') as info FROM parts WHERE generation_slug = :gen AND brand_slug = :brand AND node_name_en = :node GROUP BY oem_number ORDER BY oem_number LIMIT " . intval($limit) . " OFFSET " . intval($offset));
    $stmt2->execute([':gen' => $gen, ':brand' => $brand, ':node' => $node]);
    $rows = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    $parts = [];
    foreach ($rows as $r) {
        $info = clean_text($r['info']);
        $info = preg_replace('/\|\s*\|/', '|', $info);
        $info = trim($info, ' |');
        $parts[] = ['oem_number' => $r['oem_number'], 'name' => clean_text($r['name']), 'quantity' => clean_text($r['quantity']), 'info' => $info];
    }
    echo json_encode(['parts' => $parts, 'total' => $total, 'page' => $page, 'pages' => ($total > 0) ? intval(ceil($total / $limit)) : 0]);
}

function search_oem($pdo) {
    $q = isset($_GET['q']) ? trim($_GET['q']) : '';
    if (strlen($q) < 3) { echo json_encode(['error' => 'Min 3 karakter', 'results' => []]); return; }

    $stmt = $pdo->prepare("SELECT oem_number, MAX(name) as name, brand_slug, generation_slug, GROUP_CONCAT(DISTINCT node_name_en SEPARATOR ', ') as node_name_en FROM parts WHERE oem_number = :q GROUP BY oem_number, brand_slug, generation_slug LIMIT 50");
    $stmt->execute([':q' => $q]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($results)) {
        $stmt2 = $pdo->prepare("SELECT oem_number, MAX(name) as name, brand_slug, generation_slug, GROUP_CONCAT(DISTINCT node_name_en SEPARATOR ', ') as node_name_en FROM parts WHERE oem_number LIKE :q GROUP BY oem_number, brand_slug, generation_slug LIMIT 50");
        $stmt2->execute([':q' => $q . '%']);
        $results = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    }
    foreach ($results as &$r) { $r['name'] = clean_text($r['name']); }
    echo json_encode(['results' => $results, 'query' => $q]);
}

function vin_decode($pdo) {
    $vin = isset($_GET['vin']) ? strtoupper(trim($_GET['vin'])) : '';
    if (!$vin || strlen($vin) !== 17 || !preg_match('/^[A-HJ-NPR-Z0-9]{17}$/', $vin)) {
        echo json_encode(['error' => 'Gecersiz VIN numarasi. 17 karakter, I/O/Q haric.']);
        return;
    }

    $wmi_map = ['WAU'=>'audi','WUA'=>'audi','TRU'=>'audi','WBA'=>'bmw','WBS'=>'bmw','WBY'=>'bmw','4US'=>'bmw','WDB'=>'mercedes-benz','WDC'=>'mercedes-benz','WDD'=>'mercedes-benz','W1K'=>'mercedes-benz','W1N'=>'mercedes-benz','WVW'=>'volkswagen','WVG'=>'volkswagen','3VW'=>'volkswagen','WV1'=>'volkswagen','WV2'=>'volkswagen','TMB'=>'skoda','TMP'=>'skoda','VSS'=>'seat','WP0'=>'porsche','WP1'=>'porsche','YV1'=>'volvo','YV4'=>'volvo','YV2'=>'volvo','YV3'=>'volvo','JTD'=>'toyota','JTE'=>'toyota','JTN'=>'toyota','JTK'=>'toyota','2T1'=>'toyota','4T1'=>'toyota','5TD'=>'toyota','5TF'=>'toyota','JN1'=>'nissan','JN3'=>'nissan','5N1'=>'nissan','1N4'=>'nissan','1N6'=>'nissan','3N1'=>'nissan','JHM'=>'honda','1HG'=>'honda','2HG'=>'honda','5FN'=>'honda','19X'=>'honda','KMH'=>'hyundai','5NP'=>'hyundai','TMA'=>'hyundai','KNA'=>'kia','KND'=>'kia','5XY'=>'kia','VF1'=>'renault','VF6'=>'renault','VF2'=>'renault','VF3'=>'peugeot','VF7'=>'citroen','ZFA'=>'fiat','ZFF'=>'ferrari','ZAR'=>'alfa-romeo','ZLA'=>'lancia','W0L'=>'opel','W0V'=>'opel','1FA'=>'ford','1FD'=>'ford','1FM'=>'ford','1FT'=>'ford','WF0'=>'ford','1G1'=>'chevrolet','1GC'=>'chevrolet','2G1'=>'chevrolet','3G1'=>'chevrolet','JM1'=>'mazda','JM3'=>'mazda','JM7'=>'mazda','JF1'=>'subaru','JF2'=>'subaru','4S3'=>'subaru','4S4'=>'subaru','JS1'=>'suzuki','JS2'=>'suzuki','TSM'=>'suzuki','JMB'=>'mitsubishi','JMY'=>'mitsubishi','JA3'=>'mitsubishi','JA4'=>'mitsubishi','UU1'=>'dacia','SAL'=>'land-rover','SAJ'=>'jaguar','WMW'=>'mini'];
    $year_map = ['A'=>2010,'B'=>2011,'C'=>2012,'D'=>2013,'E'=>2014,'F'=>2015,'G'=>2016,'H'=>2017,'J'=>2018,'K'=>2019,'L'=>2020,'M'=>2021,'N'=>2022,'P'=>2023,'R'=>2024,'S'=>2025,'T'=>2026,'V'=>2027,'W'=>2028,'X'=>2029,'Y'=>2030,'1'=>2001,'2'=>2002,'3'=>2003,'4'=>2004,'5'=>2005,'6'=>2006,'7'=>2007,'8'=>2008,'9'=>2009];

    $wmi = substr($vin, 0, 3);
    $year_char = $vin[9];
    $model_year = isset($year_map[$year_char]) ? $year_map[$year_char] : null;

    $nhtsa_url = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/{$vin}?format=json";
    $nhtsa = null; $make = null; $model = null;
    $ctx = stream_context_create(['http' => ['timeout' => 8, 'ignore_errors' => true]]);
    $response = @file_get_contents($nhtsa_url, false, $ctx);
    if ($response) {
        $data = json_decode($response, true);
        if ($data && isset($data['Results'][0])) {
            $r = $data['Results'][0];
            if ($r['Make'] ?? '') {
                $make = $r['Make']; $model = $r['Model'] ?? '';
                if ($r['ModelYear'] ?? '') $model_year = (int)$r['ModelYear'];
                $nhtsa = ['make' => $make, 'model' => $model, 'year' => $model_year, 'body' => $r['BodyClass'] ?? '', 'engine' => trim(($r['DisplacementL'] ?? '') . 'L ' . ($r['EngineCylinders'] ?? '') . ' cyl'), 'fuel' => $r['FuelTypePrimary'] ?? '', 'drive' => $r['DriveType'] ?? '', 'plant_country' => $r['PlantCountry'] ?? '', 'error_code' => $r['ErrorCode'] ?? ''];
            }
        }
    }

    $brand_slug = null;
    if ($make) {
        $make_lower = strtolower(trim($make));
        $slug_aliases = ['volkswagen'=>'volkswagen','skoda'=>'skoda','mercedes-benz'=>'mercedes-benz','mercedes benz'=>'mercedes-benz','bmw'=>'bmw','audi'=>'audi','toyota'=>'toyota','nissan'=>'nissan','honda'=>'honda','hyundai'=>'hyundai','kia'=>'kia','ford'=>'ford','renault'=>'renault','peugeot'=>'peugeot','citroen'=>'citroen','fiat'=>'fiat','opel'=>'opel','volvo'=>'volvo','mazda'=>'mazda','subaru'=>'subaru','suzuki'=>'suzuki','mitsubishi'=>'mitsubishi','chevrolet'=>'chevrolet','dacia'=>'dacia','seat'=>'seat','porsche'=>'porsche','jaguar'=>'jaguar','land rover'=>'land-rover','mini'=>'mini','alfa romeo'=>'alfa-romeo','infiniti'=>'infiniti','lexus'=>'lexus','acura'=>'acura'];
        $brand_slug = isset($slug_aliases[$make_lower]) ? $slug_aliases[$make_lower] : strtolower(str_replace(' ', '-', $make_lower));
    }
    if (!$brand_slug && isset($wmi_map[$wmi])) { $brand_slug = $wmi_map[$wmi]; if (!$make) $make = ucfirst($brand_slug); }
    if (!$brand_slug) { echo json_encode(['error' => 'Bu VIN numarasi icin marka belirlenemedi.', 'vin' => $vin, 'wmi' => $wmi]); return; }

    $stmt = $pdo->prepare("SELECT DISTINCT generation_slug FROM parts WHERE brand_slug = :brand LIMIT 500");
    $stmt->execute([':brand' => $brand_slug]);
    $db_gens = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $matched_gens = [];
    if ($model && strlen($model) > 0 && count($db_gens) > 0) {
        $model_lower = strtolower($model);
        $model_slug = str_replace(' ', '-', $model_lower);
        foreach ($db_gens as $gen) {
            $gen_lower = strtolower($gen);
            if (strpos($gen_lower, $model_slug) !== false || strpos($gen_lower, $model_lower) !== false) $matched_gens[] = $gen;
        }
    }

    $platform_match = null;
    if (empty($matched_gens)) {
        $vin_codes = [substr($vin, 5, 3), substr($vin, 5, 2), substr($vin, 3, 4), substr($vin, 4, 3), substr($vin, 6, 2)];
        try {
            $placeholders = []; $params = [':brand' => $brand_slug];
            foreach ($vin_codes as $i => $code) { $code = strtoupper($code); if (strlen($code) >= 2) { $placeholders[] = ":code{$i}"; $params[":code{$i}"] = $code; } }
            if (!empty($placeholders)) {
                $stmt_vp = $pdo->prepare("SELECT DISTINCT generation_slug, platform_code FROM vin_patterns WHERE brand_slug = :brand AND platform_code IN (" . implode(',', $placeholders) . ")");
                $stmt_vp->execute($params);
                $vp_results = $stmt_vp->fetchAll(PDO::FETCH_ASSOC);
                if (!empty($vp_results)) {
                    $platform_match = $vp_results[0]['platform_code'];
                    foreach ($vp_results as $vp) $matched_gens[] = $vp['generation_slug'];
                    $matched_gens = array_unique($matched_gens);
                }
            }
        } catch (PDOException $e) {}
    }

    $gen_details = [];
    foreach ($matched_gens as $gen) {
        $stmt2 = $pdo->prepare("SELECT COUNT(DISTINCT oem_number) as part_count FROM parts WHERE brand_slug = :brand AND generation_slug = :gen");
        $stmt2->execute([':brand' => $brand_slug, ':gen' => $gen]);
        $gen_details[] = ['generation_slug' => $gen, 'generation_name' => format_gen_slug($gen), 'part_count' => (int)$stmt2->fetchColumn()];
    }
    usort($gen_details, function($a, $b) { return $b['part_count'] - $a['part_count']; });

    echo json_encode(['vin' => $vin, 'make' => $make, 'model' => $model, 'year' => $model_year, 'brand_slug' => $brand_slug, 'nhtsa' => $nhtsa, 'platform_code' => $platform_match, 'generations' => $gen_details, 'all_brand_generations' => count($db_gens), 'matched' => count($matched_gens) > 0]);
}

function get_brands($pdo) {
    $stmt = $pdo->query("SELECT brand_slug, COUNT(DISTINCT generation_slug) as gen_count, COUNT(*) as part_count FROM parts GROUP BY brand_slug ORDER BY part_count DESC");
    $brands = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $name_map = ['audi'=>'Audi','bmw'=>'BMW','volkswagen'=>'Volkswagen','mercedes-benz'=>'Mercedes-Benz','skoda'=>'Skoda','seat'=>'SEAT','porsche'=>'Porsche','volvo'=>'Volvo','toyota'=>'Toyota','nissan'=>'Nissan','honda'=>'Honda','hyundai'=>'Hyundai','kia'=>'Kia','ford'=>'Ford','renault'=>'Renault','peugeot'=>'Peugeot','citroen'=>'Citroen','fiat'=>'Fiat','opel'=>'Opel','mazda'=>'Mazda','subaru'=>'Subaru','suzuki'=>'Suzuki','mitsubishi'=>'Mitsubishi','chevrolet'=>'Chevrolet','dacia'=>'Dacia','mini'=>'MINI','alfa-romeo'=>'Alfa Romeo','land-rover'=>'Land Rover','jaguar'=>'Jaguar','infiniti'=>'Infiniti','lexus'=>'Lexus','vauxhall'=>'Vauxhall','datsun'=>'Datsun','holden'=>'Holden','scion'=>'Scion'];
    foreach ($brands as &$b) { $b['brand_name'] = isset($name_map[$b['brand_slug']]) ? $name_map[$b['brand_slug']] : ucfirst($b['brand_slug']); }
    echo json_encode(['brands' => $brands]);
}

function get_generations($pdo) {
    $brand = isset($_GET['brand']) ? $_GET['brand'] : '';
    if (!$brand) { echo json_encode(['error' => 'brand parametresi gerekli']); return; }
    $stmt = $pdo->prepare("SELECT generation_slug, COUNT(DISTINCT oem_number) as part_count FROM parts WHERE brand_slug = :brand GROUP BY generation_slug ORDER BY generation_slug");
    $stmt->execute([':brand' => $brand]);
    $gens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($gens as &$g) { $g['generation_name'] = format_gen_slug($g['generation_slug']); }
    echo json_encode(['brand' => $brand, 'generations' => $gens]);
}

function handle_chat($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    $ticketId = trim($_POST['ticket_id'] ?? '');
    $message  = trim($_POST['message'] ?? '');
    $name     = trim($_POST['name'] ?? '');
    $vehicle  = trim($_POST['vehicle'] ?? '');
    $phone    = trim($_POST['phone'] ?? '');
    $vin      = trim($_POST['vin'] ?? '');
    $pageUrl  = trim($_POST['page_url'] ?? '');

    if (!$ticketId || !$message) { http_response_code(400); echo json_encode(['error' => 'ticket_id ve message zorunludur']); return; }
    if (!preg_match('/^[A-Z0-9]{6,20}$/i', $ticketId)) { http_response_code(400); echo json_encode(['error' => 'Gecersiz ticket_id']); return; }
    if (mb_strlen($message) > 2000) $message = mb_substr($message, 0, 2000);

    $stmt = $pdo->prepare('SELECT id FROM chat_tickets WHERE ticket_id = ?');
    $stmt->execute([$ticketId]);
    $existing = $stmt->fetch();

    if (!$existing) {
        $pdo->prepare('INSERT INTO chat_tickets (ticket_id, name, phone, vehicle, vin) VALUES (?, ?, ?, ?, ?)')->execute([$ticketId, $name ?: null, $phone ?: null, $vehicle ?: null, $vin ?: null]);
    } else {
        $updates = []; $params = [];
        if ($name) { $updates[] = 'name = ?'; $params[] = $name; }
        if ($phone) { $updates[] = 'phone = ?'; $params[] = $phone; }
        if ($vehicle) { $updates[] = 'vehicle = ?'; $params[] = $vehicle; }
        if ($vin) { $updates[] = 'vin = ?'; $params[] = $vin; }
        if (!empty($updates)) { $params[] = $ticketId; $pdo->prepare('UPDATE chat_tickets SET ' . implode(', ', $updates) . ' WHERE ticket_id = ?')->execute($params); }
    }

    $pdo->prepare('INSERT INTO chat_messages (ticket_id, sender, message, page_url) VALUES (?, ?, ?, ?)')->execute([$ticketId, 'customer', $message, $pageUrl ?: null]);

    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM chat_messages WHERE ticket_id = ? AND sender = ?');
    $countStmt->execute([$ticketId, 'customer']);
    $customerMsgCount = (int)$countStmt->fetchColumn();

    if ($customerMsgCount === 1) {
        $wamid = send_whatsapp($ticketId, $message, $name, $vehicle, $phone, $vin, $pageUrl);
        if ($wamid) { $pdo->prepare('UPDATE chat_tickets SET wa_message_id = ? WHERE ticket_id = ?')->execute([$wamid, $ticketId]); }
        $autoReply = 'Talebiniz alindi! En kisa surede size donus yapacagiz. (Talep No: #' . $ticketId . ')';
        $pdo->prepare('INSERT INTO chat_messages (ticket_id, sender, message) VALUES (?, ?, ?)')->execute([$ticketId, 'system', $autoReply]);
        echo json_encode(['success' => true, 'ticket_id' => $ticketId, 'auto_reply' => $autoReply]);
    } else {
        // Devam mesajlarında da WhatsApp bildirimi gönder + wamid güncelle
        $ticketStmt = $pdo->prepare('SELECT name FROM chat_tickets WHERE ticket_id = ?');
        $ticketStmt->execute([$ticketId]);
        $ticketData = $ticketStmt->fetch(PDO::FETCH_ASSOC);
        $chatName = ($ticketData && $ticketData['name']) ? $ticketData['name'] : ($name ?: 'Musteri');
        $wamid = send_whatsapp_followup($ticketId, $message, $chatName);
        if ($wamid) { $pdo->prepare('UPDATE chat_tickets SET wa_message_id = ? WHERE ticket_id = ?')->execute([$wamid, $ticketId]); }
        echo json_encode(['success' => true, 'ticket_id' => $ticketId]);
    }
}

function send_whatsapp($ticketId, $message, $name, $vehicle, $phone, $vin, $pageUrl) {
    $phoneId = '1032269509965333';
    $token = 'EAAUjcHbTUhgBQwRJVJ9c4fMic6kjjorjfmaSQPy80kNQvgF3ZBlwAHzVXHNUQAYTd9JnVaZBAiYDcKDZCCGxeRFthZBz5IQXSURjMG5wEV5pUKRFphPONP9fPa5q2aZAqa6Dvcw4k635VAw6wyKOr897ZBmLRx1YSGKfZCeFdz9m5AFC7NwXTRF8izJSZCR4IFFe6QZDZD';
    $adminNumbers = ['905343912013'];
    if (!$phoneId || !$token || empty($adminNumbers)) return null;

    $text = "Yeni Talep #$ticketId\n" . ($name ? $name : 'Anonim') . "\n" . ($phone ? "Tel: $phone\n" : "") . ($vehicle ? "Arac: $vehicle\n" : "") . ($vin ? "Sase: $vin\n" : "") . "---\n" . $message;
    $wamid = null;

    foreach ($adminNumbers as $number) {
        $ch = curl_init("https://graph.facebook.com/v21.0/$phoneId/messages");
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_HTTPHEADER => ["Authorization: Bearer $token", "Content-Type: application/json"], CURLOPT_POSTFIELDS => json_encode(['messaging_product' => 'whatsapp', 'to' => $number, 'type' => 'text', 'text' => ['body' => $text]]), CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($httpCode === 200 && $response) {
            $resData = json_decode($response, true);
            if (isset($resData['messages'][0]['id'])) $wamid = $resData['messages'][0]['id'];
        }
    }
    return $wamid;
}

function send_whatsapp_followup($ticketId, $message, $name) {
    $phoneId = '1032269509965333';
    $token = 'EAAUjcHbTUhgBQwRJVJ9c4fMic6kjjorjfmaSQPy80kNQvgF3ZBlwAHzVXHNUQAYTd9JnVaZBAiYDcKDZCCGxeRFthZBz5IQXSURjMG5wEV5pUKRFphPONP9fPa5q2aZAqa6Dvcw4k635VAw6wyKOr897ZBmLRx1YSGKfZCeFdz9m5AFC7NwXTRF8izJSZCR4IFFe6QZDZD';
    $adminNumbers = ['905343912013'];
    if (!$phoneId || !$token || empty($adminNumbers)) return null;

    $text = ($name ?: 'Musteri') . " (#$ticketId):\n$message";
    $wamid = null;

    foreach ($adminNumbers as $number) {
        $ch = curl_init("https://graph.facebook.com/v21.0/$phoneId/messages");
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_HTTPHEADER => ["Authorization: Bearer $token", "Content-Type: application/json"], CURLOPT_POSTFIELDS => json_encode(['messaging_product' => 'whatsapp', 'to' => $number, 'type' => 'text', 'text' => ['body' => $text]]), CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($httpCode === 200 && $response) {
            $resData = json_decode($response, true);
            if (isset($resData['messages'][0]['id'])) $wamid = $resData['messages'][0]['id'];
        }
    }
    return $wamid;
}

function handle_chat_messages($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); echo json_encode(['error' => 'GET only']); return; }
    $ticketId = trim($_GET['ticket_id'] ?? '');
    if (!$ticketId) { echo json_encode(['messages' => []]); return; }
    $stmt = $pdo->prepare("SELECT id, ticket_id, sender, message, created_at FROM chat_messages WHERE ticket_id = ? ORDER BY id ASC");
    $stmt->execute([$ticketId]);
    echo json_encode(['messages' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

// ==================== JWT Functions ====================

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function jwt_encode($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;
    $segments = [base64url_encode($header), base64url_encode(json_encode($payload))];
    $signing_input = implode('.', $segments);
    $signature = hash_hmac('sha256', $signing_input, JWT_SECRET, true);
    $segments[] = base64url_encode($signature);
    return implode('.', $segments);
}

function jwt_decode($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    $signature = hash_hmac('sha256', $parts[0] . '.' . $parts[1], JWT_SECRET, true);
    if (!hash_equals(base64url_encode($signature), $parts[2])) return null;
    $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) return null;
    return $payload;
}

function get_auth_user_id() {
    $header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
    if (!$header || !preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) return null;
    $payload = jwt_decode($matches[1]);
    return $payload ? ($payload['user_id'] ?? null) : null;
}

// ==================== Auth Handlers ====================

function handle_register($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }

    try {
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $name = trim($_POST['name'] ?? '');
        $phone = trim($_POST['phone'] ?? '');

        // Validation
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo json_encode(['error' => 'Gecerli bir e-posta adresi giriniz']); return; }
        if (mb_strlen($name) < 2) { http_response_code(400); echo json_encode(['error' => 'Ad en az 2 karakter olmali']); return; }
        if (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password) || !preg_match('/[0-9]/', $password)) {
            http_response_code(400); echo json_encode(['error' => 'Sifre en az 8 karakter, 1 buyuk harf, 1 kucuk harf ve 1 rakam icermeli']); return;
        }

        // Check existing
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) { http_response_code(409); echo json_encode(['error' => 'Bu e-posta adresi zaten kayitli']); return; }

        // Create user
        $password_hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $verify_token = bin2hex(random_bytes(32));
        $verify_expires = date('Y-m-d H:i:s', time() + 86400); // 24h

        $stmt = $pdo->prepare('INSERT INTO users (email, password_hash, name, phone, email_verified, verify_token, verify_expires) VALUES (?, ?, ?, ?, 0, ?, ?)');
        $stmt->execute([$email, $password_hash, $name, $phone ?: null, $verify_token, $verify_expires]);

        // Send verification email
        send_verification_email($email, $name, $verify_token);

        echo json_encode(['success' => true, 'message' => 'Kayit basarili! Lutfen e-postanizi kontrol edin ve hesabinizi dogrulayin.']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Kayit hatasi: ' . $e->getMessage()]);
    }
}

function handle_login($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    try {
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (!$email || !$password) { http_response_code(400); echo json_encode(['error' => 'E-posta ve sifre gerekli']); return; }

        $stmt = $pdo->prepare('SELECT id, email, password_hash, name, phone, email_verified FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401); echo json_encode(['error' => 'E-posta veya sifre hatali']); return;
        }

        if (!$user['email_verified']) {
            http_response_code(403); echo json_encode(['error' => 'email_not_verified', 'message' => 'Lutfen e-postanizi dogrulayin. Dogrulama linki e-posta adresinize gonderildi.']); return;
        }

        $token = jwt_encode(['user_id' => $user['id']]);
        echo json_encode([
            'message' => 'Giris basarili',
            'token' => $token,
            'user' => ['id' => (int)$user['id'], 'email' => $user['email'], 'name' => $user['name'], 'phone' => $user['phone']]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Login hatasi: ' . $e->getMessage()]);
    }
}

function handle_profile($pdo) {
    try {
        $user_id = get_auth_user_id();
        if (!$user_id) { http_response_code(401); echo json_encode(['error' => 'Oturum gecersiz']); return; }

        $stmt = $pdo->prepare('SELECT id, email, name, phone FROM users WHERE id = ?');
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) { http_response_code(404); echo json_encode(['error' => 'Kullanici bulunamadi']); return; }

        echo json_encode(['user' => ['id' => (int)$user['id'], 'email' => $user['email'], 'name' => $user['name'], 'phone' => $user['phone']]]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Profil hatasi: ' . $e->getMessage()]);
    }
}

function handle_verify_email($pdo) {
    try {
        $token = trim($_GET['token'] ?? $_POST['token'] ?? '');
        if (!$token) { http_response_code(400); echo json_encode(['error' => 'Dogrulama tokeni gerekli']); return; }

        $stmt = $pdo->prepare('SELECT id, email_verified, verify_expires FROM users WHERE verify_token = ?');
        $stmt->execute([$token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) { http_response_code(400); echo json_encode(['error' => 'Gecersiz dogrulama linki']); return; }
        if ($user['email_verified']) { echo json_encode(['success' => true, 'message' => 'E-postaniz zaten dogrulandi']); return; }
        if ($user['verify_expires'] && strtotime($user['verify_expires']) < time()) {
            http_response_code(400); echo json_encode(['error' => 'Dogrulama linkinin suresi dolmus. Lutfen yeni bir link isteyin.']); return;
        }

        $stmt = $pdo->prepare('UPDATE users SET email_verified = 1, verify_token = NULL, verify_expires = NULL WHERE id = ?');
        $stmt->execute([$user['id']]);

        echo json_encode(['success' => true, 'message' => 'E-postaniz basariyla dogrulandi! Artik giris yapabilirsiniz.']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Dogrulama hatasi: ' . $e->getMessage()]);
    }
}

function handle_resend_verify($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    try {
        $email = trim($_POST['email'] ?? '');
        if (!$email) { http_response_code(400); echo json_encode(['error' => 'E-posta adresi gerekli']); return; }

        $stmt = $pdo->prepare('SELECT id, name, email_verified, verify_expires FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) { echo json_encode(['success' => true, 'message' => 'Eger bu e-posta kayitliysa dogrulama linki gonderildi.']); return; }
        if ($user['email_verified']) { echo json_encode(['success' => true, 'message' => 'E-postaniz zaten dogrulandi. Giris yapabilirsiniz.']); return; }

        // Rate limit: 5 min
        if ($user['verify_expires']) {
            $last_sent = strtotime($user['verify_expires']) - 86400; // verify_expires = sent_time + 24h
            if (time() - $last_sent < 300) {
                http_response_code(429); echo json_encode(['error' => 'Lutfen 5 dakika bekleyip tekrar deneyin.']); return;
            }
        }

        $verify_token = bin2hex(random_bytes(32));
        $verify_expires = date('Y-m-d H:i:s', time() + 86400);
        $stmt = $pdo->prepare('UPDATE users SET verify_token = ?, verify_expires = ? WHERE id = ?');
        $stmt->execute([$verify_token, $verify_expires, $user['id']]);

        send_verification_email($email, $user['name'], $verify_token);
        echo json_encode(['success' => true, 'message' => 'Dogrulama e-postasi tekrar gonderildi.']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Resend hatasi: ' . $e->getMessage()]);
    }
}

function handle_forgot_password($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    try {
        $email = trim($_POST['email'] ?? '');
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo json_encode(['error' => 'Gecerli bir e-posta adresi giriniz']); return; }

        $stmt = $pdo->prepare('SELECT id, name, verify_expires FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Always return success to prevent email enumeration
        if (!$user) { echo json_encode(['success' => true, 'message' => 'Eger bu e-posta kayitliysa sifre sifirlama linki gonderildi.']); return; }

        // Rate limit: 5 min
        if ($user['verify_expires']) {
            $last_sent = strtotime($user['verify_expires']) - 86400;
            if (time() - $last_sent < 300) {
                http_response_code(429); echo json_encode(['error' => 'Lutfen 5 dakika bekleyip tekrar deneyin.']); return;
            }
        }

        $reset_token = bin2hex(random_bytes(32));
        $reset_expires = date('Y-m-d H:i:s', time() + 3600); // 1 saat
        $stmt = $pdo->prepare('UPDATE users SET verify_token = ?, verify_expires = ? WHERE id = ?');
        $stmt->execute([$reset_token, $reset_expires, $user['id']]);

        send_reset_email($email, $user['name'], $reset_token);
        echo json_encode(['success' => true, 'message' => 'Sifre sifirlama linki e-posta adresinize gonderildi.']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Sifre sifirlama hatasi: ' . $e->getMessage()]);
    }
}

function handle_reset_password($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    try {
        $token = trim($_POST['token'] ?? '');
        $password = $_POST['password'] ?? '';

        if (!$token) { http_response_code(400); echo json_encode(['error' => 'Sifirlama tokeni gerekli']); return; }
        if (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password) || !preg_match('/[0-9]/', $password)) {
            http_response_code(400); echo json_encode(['error' => 'Sifre en az 8 karakter, 1 buyuk harf, 1 kucuk harf ve 1 rakam icermeli']); return;
        }

        $stmt = $pdo->prepare('SELECT id, verify_expires FROM users WHERE verify_token = ?');
        $stmt->execute([$token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) { http_response_code(400); echo json_encode(['error' => 'Gecersiz veya suresi dolmus sifirlama linki']); return; }
        if ($user['verify_expires'] && strtotime($user['verify_expires']) < time()) {
            http_response_code(400); echo json_encode(['error' => 'Sifirlama linkinin suresi dolmus. Lutfen yeni bir link isteyin.']); return;
        }

        $password_hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $stmt = $pdo->prepare('UPDATE users SET password_hash = ?, verify_token = NULL, verify_expires = NULL, email_verified = 1 WHERE id = ?');
        $stmt->execute([$password_hash, $user['id']]);

        echo json_encode(['success' => true, 'message' => 'Sifreniz basariyla degistirildi! Artik giris yapabilirsiniz.']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Sifre degistirme hatasi: ' . $e->getMessage()]);
    }
}

// ==================== E-posta Gönderimi (SMTP) ====================

function smtp_send($to, $subject_text, $html_body) {
    $from_email = 'noreply@parcabizden.com.tr';
    $from_name  = 'ParcaBizden';
    $subject = '=?UTF-8?B?' . base64_encode($subject_text) . '?=';

    // Boundary for MIME
    $boundary = md5(uniqid(time()));
    $body  = "MIME-Version: 1.0\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= chunk_split(base64_encode($html_body));

    // Try multiple SMTP methods
    // Method 1: PHP mail() if available
    if (function_exists('mail')) {
        $headers  = "From: $from_name <$from_email>\r\n";
        $headers .= "Reply-To: $from_email\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $result = @mail($to, $subject, $html_body, $headers);
        if ($result) return true;
    }

    // Method 2: Direct SMTP via fsockopen (localhost:25)
    $smtp_hosts = ['localhost', '127.0.0.1', 'mail.parcabizden.com.tr'];
    $smtp_ports = [25, 587];
    $hostname = 'parcabizden.com.tr';

    foreach ($smtp_hosts as $host) {
        foreach ($smtp_ports as $port) {
            $sock = @fsockopen($host, $port, $errno, $errstr, 5);
            if (!$sock) continue;

            $resp = @fgets($sock, 512);
            if (!$resp || substr($resp, 0, 3) !== '220') { @fclose($sock); continue; }

            $commands = [
                "EHLO $hostname\r\n",
                "MAIL FROM:<$from_email>\r\n",
                "RCPT TO:<$to>\r\n",
                "DATA\r\n",
            ];

            $ok = true;
            foreach ($commands as $cmd) {
                @fwrite($sock, $cmd);
                $resp = @fgets($sock, 512);
                // EHLO may have multi-line response
                if (strpos($cmd, 'EHLO') === 0) {
                    while ($resp && substr($resp, 3, 1) === '-') { $resp = @fgets($sock, 512); }
                }
                $code = (int)substr($resp, 0, 3);
                if ($code < 200 || $code >= 400) { $ok = false; break; }
            }

            if ($ok) {
                $msg  = "From: $from_name <$from_email>\r\n";
                $msg .= "To: $to\r\n";
                $msg .= "Subject: $subject\r\n";
                $msg .= "MIME-Version: 1.0\r\n";
                $msg .= "Content-Type: text/html; charset=UTF-8\r\n";
                $msg .= "Content-Transfer-Encoding: base64\r\n";
                $msg .= "\r\n";
                $msg .= chunk_split(base64_encode($html_body));
                $msg .= "\r\n.\r\n";

                @fwrite($sock, $msg);
                $resp = @fgets($sock, 512);
                @fwrite($sock, "QUIT\r\n");
                @fclose($sock);

                $code = (int)substr($resp, 0, 3);
                if ($code >= 200 && $code < 300) return true;
            } else {
                @fwrite($sock, "QUIT\r\n");
                @fclose($sock);
            }
        }
    }

    // Method 3: Log to file as fallback
    @file_put_contents(__DIR__ . '/email_queue.log',
        date('Y-m-d H:i:s') . " | TO: $to | SUBJECT: $subject_text\n", FILE_APPEND);
    return false;
}

function build_email_html($title, $greeting, $body_text, $button_url, $button_text, $note) {
    $html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">';
    $html .= '<div style="max-width:500px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">';
    $html .= '<div style="background:#f97316;padding:24px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:22px;">Parca<span style="color:#1e293b;">Bizden</span></h1></div>';
    $html .= '<div style="padding:32px 24px;text-align:center;">';
    $html .= '<h2 style="color:#1e293b;margin:0 0 8px;">' . htmlspecialchars($greeting) . '</h2>';
    $html .= '<p style="color:#64748b;font-size:15px;">' . htmlspecialchars($body_text) . '</p>';
    $html .= '<a href="' . $button_url . '" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">' . htmlspecialchars($button_text) . '</a>';
    $html .= '<p style="color:#94a3b8;font-size:13px;">' . htmlspecialchars($note) . '</p>';
    $html .= '<p style="color:#94a3b8;font-size:12px;margin-top:16px;">Bu islemi siz yapmadiysan bu e-postayi gormezden gelebilirsiniz.</p>';
    $html .= '</div></div></body></html>';
    return $html;
}

function send_verification_email($email, $name, $token) {
    $url = "https://parcabizden.com.tr/dogrula?token=" . urlencode($token);
    $html = build_email_html(
        'E-posta Dogrulamasi',
        "Merhaba $name!",
        'Hesabinizi aktif etmek icin asagidaki butona tiklayin.',
        $url, 'E-postami Dogrula', 'Bu link 24 saat gecerlidir.'
    );
    smtp_send($email, 'ParcaBizden - E-posta Dogrulamasi', $html);
}

function send_reset_email($email, $name, $token) {
    $url = "https://parcabizden.com.tr/sifre-sifirla?token=" . urlencode($token);
    $html = build_email_html(
        'Sifre Sifirlama',
        "Merhaba $name!",
        'Sifrenizi sifirlamak icin asagidaki butona tiklayin.',
        $url, 'Sifremi Sifirla', 'Bu link 1 saat gecerlidir.'
    );
    smtp_send($email, 'ParcaBizden - Sifre Sifirlama', $html);
}

function handle_chat_webhook($pdo) {
    $verify_token = 'parcabizden_webhook_2024';
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $mode = $_GET['hub_mode'] ?? '';
        $token = $_GET['hub_verify_token'] ?? '';
        $challenge = $_GET['hub_challenge'] ?? '';
        if ($mode === 'subscribe' && $token === $verify_token) { header('Content-Type: text/plain'); echo $challenge; exit; }
        http_response_code(403); echo json_encode(['error' => 'Forbidden']); return;
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        @file_put_contents(__DIR__ . '/webhook_log.txt', date('Y-m-d H:i:s') . " " . $input . "\n", FILE_APPEND);
        if (isset($data['entry'][0]['changes'][0]['value']['messages'][0])) {
            $msg = $data['entry'][0]['changes'][0]['value']['messages'][0];
            $adminMessage = $msg['text']['body'] ?? '';
            if ($adminMessage) {
                $ticket = null;

                // Yöntem 1: Reply varsa (context.id) → wamid ile eşle
                if (isset($msg['context']['id'])) {
                    $stmt = $pdo->prepare("SELECT ticket_id FROM chat_tickets WHERE wa_message_id = ? LIMIT 1");
                    $stmt->execute([$msg['context']['id']]);
                    $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
                }

                // Yöntem 2: Reply yoksa → en son aktif ticket'a eşle
                if (!$ticket) {
                    $stmt = $pdo->prepare("SELECT ct.ticket_id FROM chat_tickets ct INNER JOIN chat_messages cm ON ct.ticket_id = cm.ticket_id WHERE ct.wa_message_id IS NOT NULL GROUP BY ct.ticket_id ORDER BY MAX(cm.id) DESC LIMIT 1");
                    $stmt->execute();
                    $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
                }

                if ($ticket) {
                    $pdo->prepare("INSERT INTO chat_messages (ticket_id, sender, message, created_at) VALUES (?, 'admin', ?, NOW())")->execute([$ticket['ticket_id'], $adminMessage]);
                }
            }
        }
        http_response_code(200); echo json_encode(['status' => 'ok']); return;
    }
}
