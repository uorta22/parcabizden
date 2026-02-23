<?php
header('Access-Control-Allow-Origin: https://parcabizden.com.tr');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

$DB_HOST = 'localhost';
$DB_NAME = 'u2547422_parcabizden';
$DB_USER = 'u2547422_uorta';
$DB_PASS = 'iR?]gvlh+l[AB_r2';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=3600');

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed']);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';
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
