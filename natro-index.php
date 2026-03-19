<?php
// Global error handler — production'da detay sizdirma
set_error_handler(function($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});
set_exception_handler(function($e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    error_log('PHP Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    echo json_encode(['error' => 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.']);
    exit;
});

header('Access-Control-Allow-Origin: https://parcabizden.com.tr');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000');
header('Referrer-Policy: strict-origin-when-cross-origin');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// ==================== Config (.env dosyasından oku) ====================
$_ENV_FILE = __DIR__ . '/.env';
if (file_exists($_ENV_FILE)) {
    foreach (file($_ENV_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        [$key, $val] = explode('=', $line, 2);
        putenv(trim($key) . '=' . trim($val));
    }
}

$jwtSecret = getenv('JWT_SECRET');
if (!$jwtSecret) { http_response_code(500); echo json_encode(['error' => 'Server configuration error']); error_log('FATAL: JWT_SECRET env var is not set'); exit; }
define('JWT_SECRET', $jwtSecret);
define('JWT_EXPIRY', 28800); // 8 saat

$DB_HOST = getenv('DB_HOST');
$DB_NAME = getenv('DB_NAME');
$DB_USER = getenv('DB_USER');
$DB_PASS = getenv('DB_PASS');
if (!$DB_HOST || !$DB_NAME || !$DB_USER || !$DB_PASS) { http_response_code(500); echo json_encode(['error' => 'Server configuration error']); error_log('FATAL: DB_HOST/DB_NAME/DB_USER/DB_PASS env vars must all be set'); exit; }

header('Content-Type: application/json; charset=utf-8');
$action_check = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');
$auth_actions = ['register', 'login', 'profile', 'verify_email', 'resend_verify', 'forgot_password', 'reset_password', 'garage_list', 'garage_add', 'garage_remove', 'garage_update', 'maintenance_list', 'maintenance_add', 'maintenance_update', 'maintenance_remove', 'profile_update', 'address_list', 'address_add', 'address_update', 'address_remove', 'order_list', 'order_detail', 'order_create', 'favorite_list', 'favorite_add', 'favorite_remove', 'change_password', 'delete_account', 'admin_product_add', 'admin_product_update', 'admin_product_delete', 'admin_set_default_thumbnails', 'admin_order_list', 'admin_order_update_status', 'admin_enrich_part'];
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

// Helper for php-backend modules
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Include e-commerce & admin modules (safe — skip if file not found)
$_pb_modules = ['products.php', 'orders.php', 'addresses.php', 'favorites.php', 'profile.php', 'password.php', 'admin-products.php', 'admin-orders.php'];
foreach ($_pb_modules as $_m) {
    $__f = __DIR__ . '/' . $_m;
    if (file_exists($__f)) require_once $__f;
}

// IP kara liste kontrolu
if (!check_ip_blacklist($pdo)) { exit; }

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
    case 'garage_list':   handle_garage_list($pdo); break;
    case 'garage_add':    handle_garage_add($pdo); break;
    case 'garage_remove': handle_garage_remove($pdo); break;
    case 'garage_update': handle_garage_update($pdo); break;
    case 'maintenance_list':   handle_maintenance_list($pdo); break;
    case 'maintenance_add':    handle_maintenance_add($pdo); break;
    case 'maintenance_update': handle_maintenance_update($pdo); break;
    case 'maintenance_remove': handle_maintenance_remove($pdo); break;
    case 'vehicle_specs': handle_vehicle_specs($pdo); break;
    case 'autodata_brands':     handle_autodata_brands($pdo); break;
    case 'autodata_models':     handle_autodata_models($pdo); break;
    case 'autodata_generations': handle_autodata_generations($pdo); break;
    case 'autodata_resolve_slug': handle_autodata_resolve_slug($pdo); break;
    case 'register':      handle_register($pdo); break;
    case 'login':         handle_login($pdo); break;
    case 'profile':       handle_profile($pdo); break;
    case 'verify_email':  handle_verify_email($pdo); break;
    case 'resend_verify':   handle_resend_verify($pdo); break;
    case 'forgot_password': handle_forgot_password($pdo); break;
    case 'reset_password':  handle_reset_password($pdo); break;

    // ── E-Commerce: Products (no auth) ──
    case 'product_list':    handleProductList($pdo); break;
    case 'product_detail':  handleProductDetail($pdo); break;
    case 'product_search':  handleProductSearch($pdo); break;

    // ── E-Commerce: Profile (auth) ──
    case 'profile_update':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleProfileUpdate($pdo, $uid); break;

    // ── E-Commerce: Addresses (auth) ──
    case 'address_list':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleAddressList($pdo, $uid); break;
    case 'address_add':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleAddressAdd($pdo, $uid); break;
    case 'address_update':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleAddressUpdate($pdo, $uid); break;
    case 'address_remove':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleAddressRemove($pdo, $uid); break;

    // ── E-Commerce: Orders (auth) ──
    case 'order_list':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleOrderList($pdo, $uid); break;
    case 'order_detail':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleOrderDetail($pdo, $uid); break;
    case 'order_create':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleOrderCreate($pdo, $uid); break;

    // ── E-Commerce: Favorites (auth) ──
    case 'favorite_list':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleFavoriteList($pdo, $uid); break;
    case 'favorite_add':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleFavoriteAdd($pdo, $uid); break;
    case 'favorite_remove':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleFavoriteRemove($pdo, $uid); break;

    // ── E-Commerce: Password & Account (auth) ──
    case 'change_password':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleChangePassword($pdo, $uid); break;
    case 'delete_account':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleDeleteAccount($pdo, $uid); break;

    // ── Admin: Products (auth + admin + rate limit) ──
    case 'admin_product_add':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        if (!check_rate_limit('admin_product_write', 30, 15)) break;
        handleAdminProductAdd($pdo, $uid); break;
    case 'admin_product_update':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        if (!check_rate_limit('admin_product_write', 30, 15)) break;
        handleAdminProductUpdate($pdo, $uid); break;
    case 'admin_product_delete':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        if (!check_rate_limit('admin_product_write', 30, 15)) break;
        handleAdminProductDelete($pdo, $uid); break;
    case 'admin_set_default_thumbnails':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        if (!check_rate_limit('admin_product_write', 30, 15)) break;
        handleAdminSetDefaultThumbnails($pdo, $uid); break;

    // ── Admin: Orders (auth + admin + rate limit) ──
    case 'admin_order_list':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        if (!check_rate_limit('admin_order_list', 60, 15)) break;
        handleAdminOrderList($pdo, $uid); break;
    case 'admin_order_update_status':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        if (!check_rate_limit('admin_order_update', 30, 15)) break;
        handleAdminOrderUpdateStatus($pdo, $uid); break;

    // ── Admin: Parça Zenginleştir (auth + admin + rate limit) ──
    case 'admin_enrich_part':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        if (!check_rate_limit('admin_product_write', 30, 15)) break;
        handleAdminEnrichPart($pdo, $uid); break;

    case 'db_inspect':
        // Geçici: catalog tabloları detaylı bilgi
        $q = trim($_GET['q'] ?? 'counts');
        if ($q === 'counts') {
            // information_schema'dan tahmini satır sayıları (hızlı)
            $stmt = $pdo->prepare("SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH FROM information_schema.TABLES WHERE TABLE_SCHEMA = :db ORDER BY TABLE_ROWS DESC");
            $stmt->execute([':db' => $DB_NAME]);
            $result = [];
            foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
                $result[$r['TABLE_NAME']] = ['rows' => (int)$r['TABLE_ROWS'], 'data_mb' => round($r['DATA_LENGTH']/1048576, 1), 'index_mb' => round($r['INDEX_LENGTH']/1048576, 1)];
            }
            echo json_encode($result, JSON_UNESCAPED_UNICODE);
        } elseif ($q === 'sample_parts') {
            // parts tablosundan örnek veriler
            $stmt = $pdo->query("SELECT * FROM parts LIMIT 5");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_UNESCAPED_UNICODE);
        } elseif ($q === 'sample_catalog_parts') {
            $stmt = $pdo->query("SELECT p.*, s.name AS supplier_name FROM catalog_parts p LEFT JOIN catalog_suppliers s ON p.supplier_id = s.id LIMIT 10");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_UNESCAPED_UNICODE);
        } elseif ($q === 'sample_pv') {
            $stmt = $pdo->query("SELECT pv.*, p.part_number, s.name AS supplier, v.description AS vehicle, m.name AS model, man.name AS brand FROM catalog_part_vehicles pv JOIN catalog_parts p ON pv.part_id = p.id JOIN catalog_suppliers s ON p.supplier_id = s.id JOIN catalog_vehicles v ON pv.vehicle_id = v.id JOIN catalog_models m ON v.model_id = m.id JOIN catalog_manufacturers man ON m.manufacturer_id = man.id LIMIT 10");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_UNESCAPED_UNICODE);
        } elseif ($q === 'analysis') {
            $result = [];
            // 7zap brand_slug listesi (ilk 20)
            $stmt = $pdo->query("SELECT brand_slug, COUNT(*) AS cnt FROM parts GROUP BY brand_slug ORDER BY cnt DESC LIMIT 30");
            $result['7zap_brands'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            // catalog marka listesi (ilk 20)
            $stmt = $pdo->query("SELECT m.name, COUNT(DISTINCT mo.id) AS models, COUNT(DISTINCT v.id) AS vehicles FROM catalog_manufacturers m LEFT JOIN catalog_models mo ON mo.manufacturer_id = m.id LEFT JOIN catalog_vehicles v ON v.model_id = mo.id GROUP BY m.id ORDER BY vehicles DESC LIMIT 30");
            $result['catalog_brands'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            // 7zap'dan benzersiz oem_number sayısı (approximate)
            $result['7zap_unique_oem_approx'] = (int)$pdo->query("SELECT COUNT(DISTINCT oem_number) FROM (SELECT oem_number FROM parts LIMIT 1000000) t")->fetchColumn();
            // catalog'da parça sayısı
            $result['catalog_parts_count'] = (int)$pdo->query("SELECT COUNT(*) FROM catalog_parts")->fetchColumn();
            echo json_encode($result, JSON_UNESCAPED_UNICODE);
        } elseif ($q === 'brand_match') {
            // 7zap brand_slug vs catalog marka eşleşme
            $z = $pdo->query("SELECT DISTINCT brand_slug FROM parts ORDER BY brand_slug")->fetchAll(PDO::FETCH_COLUMN);
            $c = $pdo->query("SELECT name FROM catalog_manufacturers ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
            echo json_encode(['7zap_brands' => $z, 'catalog_brands' => $c], JSON_UNESCAPED_UNICODE);
        } elseif ($q === 'migration_analysis') {
            // Hafif sorgular — step parametresiyle parçalı çalışır
            $step = (int)($_GET['step'] ?? 1);
            $result = ['step' => $step];
            if ($step === 1) {
                // vehicles tablosundaki eşleşme verileri
                $stmt = $pdo->query("SELECT best_7zap_slug, brand_name, model_name FROM vehicles WHERE best_7zap_slug IS NOT NULL AND best_7zap_slug != '' LIMIT 100");
                $result['vehicle_matches'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $result['total_vehicles'] = (int)$pdo->query("SELECT COUNT(*) FROM vehicles")->fetchColumn();
                $result['matched_vehicles'] = (int)$pdo->query("SELECT COUNT(*) FROM vehicles WHERE best_7zap_slug IS NOT NULL AND best_7zap_slug != ''")->fetchColumn();
            } elseif ($step === 2) {
                // 7zap generation_slug listesi (DISTINCT — parts_gen_summary varsa oradan)
                $stmt = $pdo->query("SELECT brand_slug, generation_slug, part_count FROM parts_gen_summary ORDER BY part_count DESC LIMIT 100");
                $result['gen_summary'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $result['total_gens'] = (int)$pdo->query("SELECT COUNT(*) FROM parts_gen_summary")->fetchColumn();
            } elseif ($step === 3) {
                // node_name_en → category eşleşmesi
                $stmt = $pdo->query("SELECT DISTINCT node_name_en FROM parts LIMIT 500");
                $nodes = $stmt->fetchAll(PDO::FETCH_COLUMN);
                $result['sample_nodes'] = array_slice($nodes, 0, 50);
                $result['total_sample_nodes'] = count($nodes);
                // node_categories tablosundan eşleşme
                $stmt = $pdo->query("SELECT node_name_en, category_id FROM node_categories LIMIT 100");
                $result['node_category_map'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } elseif ($step === 4) {
                // parts tablosu index bilgisi
                $stmt = $pdo->query("SHOW INDEX FROM parts");
                $result['parts_indexes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                // catalog_parts index bilgisi
                $stmt = $pdo->query("SHOW INDEX FROM catalog_parts");
                $result['catalog_parts_indexes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            echo json_encode($result, JSON_UNESCAPED_UNICODE);
        } elseif ($q === 'sample_7zap') {
            $result = [];
            try { $result['parts_sample'] = $pdo->query("SELECT * FROM parts LIMIT 5")->fetchAll(PDO::FETCH_ASSOC); } catch(Exception $e) { $result['parts_error'] = $e->getMessage(); }
            try { $result['vehicles_sample'] = $pdo->query("SELECT * FROM vehicles LIMIT 5")->fetchAll(PDO::FETCH_ASSOC); } catch(Exception $e) {}
            echo json_encode($result, JSON_UNESCAPED_UNICODE);
        }
        break;

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

    $stmt2 = $pdo->prepare("SELECT oem_number, MAX(name) as name, GROUP_CONCAT(DISTINCT quantity SEPARATOR ', ') as quantity, GROUP_CONCAT(DISTINCT info SEPARATOR ' | ') as info FROM parts WHERE generation_slug = :gen AND brand_slug = :brand AND node_name_en = :node GROUP BY oem_number ORDER BY oem_number LIMIT :lim OFFSET :off");
    $stmt2->bindValue(':gen', $gen, PDO::PARAM_STR);
    $stmt2->bindValue(':brand', $brand, PDO::PARAM_STR);
    $stmt2->bindValue(':node', $node, PDO::PARAM_STR);
    $stmt2->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt2->bindValue(':off', $offset, PDO::PARAM_INT);
    $stmt2->execute();
    $rows = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    $parts = [];
    $oem_list = [];
    foreach ($rows as $r) {
        $info = clean_text($r['info']);
        $info = preg_replace('/\|\s*\|/', '|', $info);
        $info = trim($info, ' |');
        $parts[] = ['oem_number' => $r['oem_number'], 'name' => clean_text($r['name']), 'quantity' => clean_text($r['quantity']), 'info' => $info];
        $oem_list[] = $r['oem_number'];
    }

    // Product enrichment — ayrı sorgu ile
    if (!empty($oem_list)) {
        $ph = implode(',', array_fill(0, count($oem_list), '?'));
        $pr_stmt = $pdo->prepare("SELECT id, slug, oem_number, price, discount_price, thumbnail, in_stock FROM products WHERE oem_number IN ($ph)");
        $pr_stmt->execute($oem_list);
        $products_map = [];
        while ($pr = $pr_stmt->fetch(PDO::FETCH_ASSOC)) {
            $products_map[$pr['oem_number']] = $pr;
        }
        foreach ($parts as &$part) {
            if (isset($products_map[$part['oem_number']])) {
                $pr = $products_map[$part['oem_number']];
                $part['product'] = [
                    'id' => (int)$pr['id'],
                    'slug' => $pr['slug'],
                    'price' => $pr['price'] !== null ? (float)$pr['price'] : null,
                    'discount_price' => $pr['discount_price'] !== null ? (float)$pr['discount_price'] : null,
                    'thumbnail' => $pr['thumbnail'],
                    'in_stock' => (bool)$pr['in_stock'],
                ];
            }
        }
        unset($part);
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
    unset($r);

    // Product enrichment — ayrı sorgu ile
    $oem_list = array_unique(array_column($results, 'oem_number'));
    $products_map = [];
    if (!empty($oem_list)) {
        $ph = implode(',', array_fill(0, count($oem_list), '?'));
        $pr_stmt = $pdo->prepare("SELECT id, slug, oem_number, price, discount_price, thumbnail, in_stock FROM products WHERE oem_number IN ($ph)");
        $pr_stmt->execute(array_values($oem_list));
        while ($pr = $pr_stmt->fetch(PDO::FETCH_ASSOC)) {
            $products_map[$pr['oem_number']] = $pr;
        }
    }
    foreach ($results as &$r) {
        if (isset($products_map[$r['oem_number']])) {
            $pr = $products_map[$r['oem_number']];
            $r['product'] = [
                'id' => (int)$pr['id'],
                'slug' => $pr['slug'],
                'price' => $pr['price'] !== null ? (float)$pr['price'] : null,
                'discount_price' => $pr['discount_price'] !== null ? (float)$pr['discount_price'] : null,
                'thumbnail' => $pr['thumbnail'],
                'in_stock' => (bool)$pr['in_stock'],
            ];
        }
    }
    unset($r);
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
    // Summary tablodan hızlı okuma (17M satırlık parts'tan GROUP BY yerine)
    try {
        $stmt = $pdo->query("SELECT brand_slug, gen_count, part_count FROM parts_brand_summary ORDER BY part_count DESC");
        $brands = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // Fallback: orijinal yavaş sorgu
        $stmt = $pdo->query("SELECT brand_slug, COUNT(DISTINCT generation_slug) as gen_count, COUNT(*) as part_count FROM parts GROUP BY brand_slug ORDER BY part_count DESC");
        $brands = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    $name_map = ['audi'=>'Audi','bmw'=>'BMW','volkswagen'=>'Volkswagen','mercedes-benz'=>'Mercedes-Benz','skoda'=>'Skoda','seat'=>'SEAT','porsche'=>'Porsche','volvo'=>'Volvo','toyota'=>'Toyota','nissan'=>'Nissan','honda'=>'Honda','hyundai'=>'Hyundai','kia'=>'Kia','ford'=>'Ford','renault'=>'Renault','peugeot'=>'Peugeot','citroen'=>'Citroen','fiat'=>'Fiat','opel'=>'Opel','mazda'=>'Mazda','subaru'=>'Subaru','suzuki'=>'Suzuki','mitsubishi'=>'Mitsubishi','chevrolet'=>'Chevrolet','dacia'=>'Dacia','mini'=>'MINI','alfa-romeo'=>'Alfa Romeo','land-rover'=>'Land Rover','jaguar'=>'Jaguar','infiniti'=>'Infiniti','lexus'=>'Lexus','vauxhall'=>'Vauxhall','datsun'=>'Datsun','holden'=>'Holden','scion'=>'Scion'];
    foreach ($brands as &$b) { $b['brand_name'] = isset($name_map[$b['brand_slug']]) ? $name_map[$b['brand_slug']] : ucfirst($b['brand_slug']); }
    echo json_encode(['brands' => $brands]);
}

function get_generations($pdo) {
    $brand = isset($_GET['brand']) ? $_GET['brand'] : '';
    if (!$brand) { echo json_encode(['error' => 'brand parametresi gerekli']); return; }
    // Summary tablodan hızlı okuma
    try {
        $stmt = $pdo->prepare("SELECT generation_slug, part_count FROM parts_gen_summary WHERE brand_slug = :brand ORDER BY generation_slug");
        $stmt->execute([':brand' => $brand]);
        $gens = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (empty($gens)) throw new PDOException('empty');
    } catch (PDOException $e) {
        // Fallback: orijinal yavaş sorgu
        $stmt = $pdo->prepare("SELECT generation_slug, COUNT(DISTINCT oem_number) as part_count FROM parts WHERE brand_slug = :brand GROUP BY generation_slug ORDER BY generation_slug");
        $stmt->execute([':brand' => $brand]);
        $gens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
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
    $phoneId = getenv('WHATSAPP_PHONE_NUMBER_ID') ?: '';
    $token = getenv('WHATSAPP_ACCESS_TOKEN') ?: '';
    $adminNumbers = array_filter(explode(',', getenv('WHATSAPP_ADMIN_NUMBERS') ?: ''));
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
    $phoneId = getenv('WHATSAPP_PHONE_NUMBER_ID') ?: '';
    $token = getenv('WHATSAPP_ACCESS_TOKEN') ?: '';
    $adminNumbers = array_filter(explode(',', getenv('WHATSAPP_ADMIN_NUMBERS') ?: ''));
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

// ==================== Vehicle Specs Handler ====================

function handle_vehicle_specs($pdo) {
    // Direct ID lookup — fastest path when spec_id is known
    $spec_id = isset($_GET['spec_id']) && $_GET['spec_id'] !== '' ? intval($_GET['spec_id']) : null;
    if ($spec_id) {
        try {
            $stmt = $pdo->prepare('SELECT id, brand, model, generation, modification, year_start, year_end, body_type, fuel_type, engine_cc, cylinders, power_hp, torque_nm, transmission, drivetrain, top_speed_kmh, accel_0_100, fuel_combined, length_mm, width_mm, height_mm, wheelbase_mm, weight_kg, trunk_liters, fuel_tank_liters, doors, seats FROM vehicle_specs WHERE id = :id');
            $stmt->execute([':id' => $spec_id]);
            $spec = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($spec) {
                $spec['id'] = (int)$spec['id'];
                foreach (['year_start','year_end','engine_cc','cylinders','length_mm','width_mm','height_mm','wheelbase_mm','doors','seats'] as $k) { $spec[$k] = $spec[$k] !== null ? (int)$spec[$k] : null; }
                foreach (['power_hp','torque_nm','top_speed_kmh','accel_0_100','fuel_combined','weight_kg','trunk_liters','fuel_tank_liters'] as $k) { $spec[$k] = $spec[$k] !== null ? (float)$spec[$k] : null; }

                // Also fetch sibling specs (same brand+model+generation)
                $siblings = $pdo->prepare('SELECT id, brand, model, generation, modification, year_start, year_end, body_type, fuel_type, engine_cc, cylinders, power_hp, torque_nm, transmission, drivetrain, top_speed_kmh, accel_0_100, fuel_combined, length_mm, width_mm, height_mm, wheelbase_mm, weight_kg, trunk_liters, fuel_tank_liters, doors, seats FROM vehicle_specs WHERE brand = :brand AND model = :model AND generation = :gen ORDER BY modification');
                $siblings->execute([':brand' => $spec['brand'], ':model' => $spec['model'], ':gen' => $spec['generation']]);
                $all_specs = $siblings->fetchAll(PDO::FETCH_ASSOC);
                foreach ($all_specs as &$s) {
                    $s['id'] = (int)$s['id'];
                    foreach (['year_start','year_end','engine_cc','cylinders','length_mm','width_mm','height_mm','wheelbase_mm','doors','seats'] as $k) { $s[$k] = $s[$k] !== null ? (int)$s[$k] : null; }
                    foreach (['power_hp','torque_nm','top_speed_kmh','accel_0_100','fuel_combined','weight_kg','trunk_liters','fuel_tank_liters'] as $k) { $s[$k] = $s[$k] !== null ? (float)$s[$k] : null; }
                }
                echo json_encode(['specs' => $all_specs, 'models' => [], 'brand' => $spec['brand']]);
                return;
            }
        } catch (PDOException $e) {}
    }

    $brand_slug = trim($_GET['brand'] ?? '');
    if (!$brand_slug) { echo json_encode(['error' => 'brand parametresi gerekli']); return; }

    $generation = trim($_GET['generation'] ?? '');
    $year = isset($_GET['year']) && $_GET['year'] !== '' ? intval($_GET['year']) : null;
    $model_filter = trim($_GET['model'] ?? '');

    // Brand slug → autodata brand name map
    $brand_map = [
        'audi' => 'Audi', 'bmw' => 'BMW', 'volkswagen' => 'Volkswagen',
        'mercedes-benz' => 'Mercedes-Benz', 'skoda' => 'Skoda', 'seat' => 'SEAT',
        'porsche' => 'Porsche', 'volvo' => 'Volvo', 'toyota' => 'Toyota',
        'nissan' => 'Nissan', 'honda' => 'Honda', 'hyundai' => 'Hyundai',
        'kia' => 'Kia', 'ford' => 'Ford', 'renault' => 'Renault',
        'peugeot' => 'Peugeot', 'citroen' => 'Citroen', 'fiat' => 'Fiat',
        'opel' => 'Opel', 'mazda' => 'Mazda', 'subaru' => 'Subaru',
        'suzuki' => 'Suzuki', 'mitsubishi' => 'Mitsubishi', 'chevrolet' => 'Chevrolet',
        'dacia' => 'Dacia', 'mini' => 'MINI', 'alfa-romeo' => 'Alfa Romeo',
        'land-rover' => 'Land Rover', 'jaguar' => 'Jaguar', 'lexus' => 'Lexus',
        'infiniti' => 'Infiniti', 'cupra' => 'Cupra', 'ds' => 'DS',
        'genesis' => 'Genesis', 'tesla' => 'Tesla', 'ferrari' => 'Ferrari',
        'lamborghini' => 'Lamborghini', 'maserati' => 'Maserati',
        'bentley' => 'Bentley', 'aston-martin' => 'Aston Martin',
        'rolls-royce' => 'Rolls-Royce', 'bugatti' => 'Bugatti',
        'abarth' => 'Fiat', 'lancia' => 'Lancia',
    ];

    $brand_name = isset($brand_map[$brand_slug]) ? $brand_map[$brand_slug] : ucfirst($brand_slug);

    // Build query
    $where = ['brand = :brand'];
    $params = [':brand' => $brand_name];

    // Generation fuzzy match — multi-strategy
    if ($generation) {
        // 1. Extract model name (text before parenthesis): "Octavia (NX3)" → "Octavia"
        $model_name = trim(preg_replace('/\s*\(.*$/', '', $generation));

        // 2. Extract platform code from parentheses: "(E90)" → "E90", "(NX3)" → "NX3"
        $platform_code = null;
        if (preg_match('/\(([A-Z0-9]+)\)/i', $generation, $m)) {
            $platform_code = strtoupper($m[1]);
        }

        // 3. Try platform code in autodata generation first
        $gen_conditions = [];
        if ($platform_code) {
            $gen_conditions[] = 'generation LIKE :gen_platform';
            $params[':gen_platform'] = '%' . $platform_code . '%';
        }

        // 4. Also try model name match (most reliable fallback)
        if ($model_name) {
            $gen_conditions[] = 'model LIKE :gen_model';
            $params[':gen_model'] = '%' . $model_name . '%';
        }

        // 5. Also try full generation string
        $gen_conditions[] = 'generation LIKE :gen_full';
        $params[':gen_full'] = '%' . $generation . '%';

        if (!empty($gen_conditions)) {
            $where[] = '(' . implode(' OR ', $gen_conditions) . ')';
        }
    }

    if ($model_filter) {
        $where[] = 'model LIKE :model_pattern';
        $params[':model_pattern'] = '%' . $model_filter . '%';
    }

    if ($year) {
        $where[] = '(year_start <= :year AND (year_end IS NULL OR year_end >= :year2))';
        $params[':year'] = $year;
        $params[':year2'] = $year;
    }

    $sql = 'SELECT id, brand, model, generation, modification, year_start, year_end, body_type, fuel_type, engine_cc, cylinders, power_hp, torque_nm, transmission, drivetrain, top_speed_kmh, accel_0_100, fuel_combined, length_mm, width_mm, height_mm, wheelbase_mm, weight_kg, trunk_liters, fuel_tank_liters, doors, seats FROM vehicle_specs WHERE ' . implode(' AND ', $where) . ' ORDER BY model, generation, modification LIMIT 200';

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $specs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Cast numeric fields
        foreach ($specs as &$s) {
            $s['id'] = (int)$s['id'];
            $s['year_start'] = $s['year_start'] !== null ? (int)$s['year_start'] : null;
            $s['year_end'] = $s['year_end'] !== null ? (int)$s['year_end'] : null;
            $s['engine_cc'] = $s['engine_cc'] !== null ? (int)$s['engine_cc'] : null;
            $s['cylinders'] = $s['cylinders'] !== null ? (int)$s['cylinders'] : null;
            $s['power_hp'] = $s['power_hp'] !== null ? (float)$s['power_hp'] : null;
            $s['torque_nm'] = $s['torque_nm'] !== null ? (float)$s['torque_nm'] : null;
            $s['top_speed_kmh'] = $s['top_speed_kmh'] !== null ? (float)$s['top_speed_kmh'] : null;
            $s['accel_0_100'] = $s['accel_0_100'] !== null ? (float)$s['accel_0_100'] : null;
            $s['fuel_combined'] = $s['fuel_combined'] !== null ? (float)$s['fuel_combined'] : null;
            $s['length_mm'] = $s['length_mm'] !== null ? (int)$s['length_mm'] : null;
            $s['width_mm'] = $s['width_mm'] !== null ? (int)$s['width_mm'] : null;
            $s['height_mm'] = $s['height_mm'] !== null ? (int)$s['height_mm'] : null;
            $s['wheelbase_mm'] = $s['wheelbase_mm'] !== null ? (int)$s['wheelbase_mm'] : null;
            $s['weight_kg'] = $s['weight_kg'] !== null ? (float)$s['weight_kg'] : null;
            $s['trunk_liters'] = $s['trunk_liters'] !== null ? (float)$s['trunk_liters'] : null;
            $s['fuel_tank_liters'] = $s['fuel_tank_liters'] !== null ? (float)$s['fuel_tank_liters'] : null;
            $s['doors'] = $s['doors'] !== null ? (int)$s['doors'] : null;
            $s['seats'] = $s['seats'] !== null ? (int)$s['seats'] : null;
        }

        // Also fetch distinct models+generations for this brand (for the picker)
        $models_sql = 'SELECT DISTINCT model, generation, COUNT(*) as mod_count FROM vehicle_specs WHERE brand = :brand GROUP BY model, generation ORDER BY model, generation';
        $mstmt = $pdo->prepare($models_sql);
        $mstmt->execute([':brand' => $brand_name]);
        $models = $mstmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($models as &$m) { $m['mod_count'] = (int)$m['mod_count']; }

        echo json_encode(['specs' => $specs, 'models' => $models, 'brand' => $brand_name]);
    } catch (PDOException $e) {
        // Table might not exist yet
        echo json_encode(['specs' => [], 'models' => [], 'brand' => $brand_name, 'note' => 'vehicle_specs tablosu henuz yuklu degil']);
    }
}

// ==================== Autodata Handlers ====================

function handle_autodata_brands($pdo) {
    try {
        // catalog_manufacturers + catalog_models'dan marka listesi
        $stmt = $pdo->query("
            SELECT m.name AS brand, COUNT(DISTINCT mo.id) AS model_count, COUNT(DISTINCT v.id) AS total
            FROM catalog_manufacturers m
            LEFT JOIN catalog_models mo ON mo.manufacturer_id = m.id
            LEFT JOIN catalog_vehicles v ON v.model_id = mo.id
            GROUP BY m.id, m.name
            ORDER BY m.name
        ");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $brands = [];
        foreach ($rows as $r) {
            $slug = catalog_brand_to_slug($r['brand']);
            $brands[] = [
                'name' => $r['brand'],
                'slug' => $slug,
                'model_count' => (int)$r['model_count'],
                'total' => (int)$r['total'],
            ];
        }
        echo json_encode(['brands' => $brands]);
    } catch (PDOException $e) {
        // Fallback: vehicle_specs tablosundan oku
        try {
            $stmt = $pdo->query("SELECT brand, COUNT(DISTINCT model) as model_count, COUNT(*) as total FROM vehicle_specs GROUP BY brand ORDER BY brand");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $brands = [];
            foreach ($rows as $r) {
                $slug = strtolower(trim($r['brand']));
                $slug = preg_replace('/\s+/', '-', $slug);
                $brands[] = ['name' => $r['brand'], 'slug' => $slug, 'model_count' => (int)$r['model_count'], 'total' => (int)$r['total']];
            }
            echo json_encode(['brands' => $brands]);
        } catch (PDOException $e2) {
            echo json_encode(['brands' => [], 'error' => 'Tablo bulunamadi']);
        }
    }
}

function handle_autodata_models($pdo) {
    $brand_slug = trim($_GET['brand'] ?? '');
    if (!$brand_slug) { echo json_encode(['error' => 'brand parametresi gerekli']); return; }

    // catalog_manufacturers'dan marka bul
    $brand_name = catalog_resolve_brand($pdo, $brand_slug);
    if (!$brand_name) { echo json_encode(['models' => []]); return; }

    try {
        // catalog_models + catalog_vehicles'dan model listesi
        $stmt = $pdo->prepare("
            SELECT mo.name AS model,
                   COUNT(DISTINCT v.id) AS gen_count,
                   MIN(v.year_from) AS min_year,
                   MAX(COALESCE(v.year_to, 2025)) AS max_year
            FROM catalog_models mo
            JOIN catalog_manufacturers m ON mo.manufacturer_id = m.id
            LEFT JOIN catalog_vehicles v ON v.model_id = mo.id
            WHERE m.name = :brand
            GROUP BY mo.id, mo.name
            ORDER BY mo.name
        ");
        $stmt->execute([':brand' => $brand_name]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $models = [];
        foreach ($rows as $r) {
            $models[] = [
                'name' => $r['model'],
                'gen_count' => (int)$r['gen_count'],
                'min_year' => $r['min_year'] !== null ? (int)$r['min_year'] : null,
                'max_year' => $r['max_year'] !== null ? (int)$r['max_year'] : null,
            ];
        }
        echo json_encode(['models' => $models, 'brand' => $brand_name]);
    } catch (PDOException $e) {
        // Fallback: vehicle_specs
        $brand_name_fb = autodata_resolve_brand_name($pdo, $brand_slug);
        if (!$brand_name_fb) { echo json_encode(['models' => []]); return; }
        try {
            $stmt = $pdo->prepare("SELECT DISTINCT model, COUNT(DISTINCT generation) as gen_count, MIN(year_start) as min_year, MAX(COALESCE(year_end, 2025)) as max_year FROM vehicle_specs WHERE brand = :brand GROUP BY model ORDER BY model");
            $stmt->execute([':brand' => $brand_name_fb]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $models = [];
            foreach ($rows as $r) {
                $models[] = ['name' => $r['model'], 'gen_count' => (int)$r['gen_count'], 'min_year' => $r['min_year'] !== null ? (int)$r['min_year'] : null, 'max_year' => $r['max_year'] !== null ? (int)$r['max_year'] : null];
            }
            echo json_encode(['models' => $models, 'brand' => $brand_name_fb]);
        } catch (PDOException $e2) {
            echo json_encode(['models' => []]);
        }
    }
}

function handle_autodata_generations($pdo) {
    $brand_slug = trim($_GET['brand'] ?? '');
    $model = normalize_cyrillic(trim($_GET['model'] ?? ''));
    if (!$brand_slug || !$model) { echo json_encode(['error' => 'brand ve model parametreleri gerekli']); return; }

    $brand_name = catalog_resolve_brand($pdo, $brand_slug);
    if (!$brand_name) { echo json_encode(['generations' => []]); return; }

    try {
        // catalog_vehicles gruplama — aynı description'ları birleştir
        $stmt = $pdo->prepare("
            SELECT v.description AS generation,
                   MIN(v.year_from) AS year_start,
                   MAX(v.year_to) AS year_end,
                   NULL AS body_type,
                   COUNT(*) AS mod_count
            FROM catalog_vehicles v
            JOIN catalog_models mo ON v.model_id = mo.id
            JOIN catalog_manufacturers m ON mo.manufacturer_id = m.id
            WHERE m.name = :brand AND mo.name = :model
            GROUP BY v.description
            ORDER BY MIN(v.year_from) DESC, v.description
        ");
        $stmt->execute([':brand' => $brand_name, ':model' => $model]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $generations = [];
        foreach ($rows as $r) {
            $generations[] = [
                'name' => $r['generation'],
                'year_start' => $r['year_start'] !== null ? (int)$r['year_start'] : null,
                'year_end' => $r['year_end'] !== null ? (int)$r['year_end'] : null,
                'body_type' => $r['body_type'],
                'mod_count' => (int)$r['mod_count'],
            ];
        }
        echo json_encode(['generations' => $generations]);
    } catch (PDOException $e) {
        // Fallback: vehicle_specs
        $brand_name_fb = autodata_resolve_brand_name($pdo, $brand_slug);
        if (!$brand_name_fb) { echo json_encode(['generations' => []]); return; }
        try {
            $stmt = $pdo->prepare("SELECT DISTINCT generation, MIN(year_start) as year_start, MAX(year_end) as year_end, body_type, COUNT(*) as mod_count FROM vehicle_specs WHERE brand = :brand AND model = :model GROUP BY generation, body_type ORDER BY MIN(year_start) DESC");
            $stmt->execute([':brand' => $brand_name_fb, ':model' => $model]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $generations = [];
            foreach ($rows as $r) {
                $generations[] = ['name' => $r['generation'], 'year_start' => $r['year_start'] !== null ? (int)$r['year_start'] : null, 'year_end' => $r['year_end'] !== null ? (int)$r['year_end'] : null, 'body_type' => $r['body_type'], 'mod_count' => (int)$r['mod_count']];
            }
            echo json_encode(['generations' => $generations]);
        } catch (PDOException $e2) {
            echo json_encode(['generations' => []]);
        }
    }
}

function handle_autodata_resolve_slug($pdo) {
    $brand_slug = trim($_GET['brand'] ?? '');
    $model = normalize_cyrillic(trim($_GET['model'] ?? ''));
    $generation = normalize_cyrillic(trim($_GET['generation'] ?? ''));
    if (!$brand_slug) { echo json_encode(['error' => 'brand parametresi gerekli']); return; }

    // Get all generation slugs for this brand from parts DB
    try {
        $stmt = $pdo->prepare("SELECT DISTINCT generation_slug, COUNT(DISTINCT oem_number) as part_count FROM parts WHERE brand_slug = :brand GROUP BY generation_slug");
        $stmt->execute([':brand' => $brand_slug]);
        $db_gens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        echo json_encode(['matches' => [], 'auto_selected' => null]);
        return;
    }

    if (empty($db_gens)) {
        echo json_encode(['matches' => [], 'auto_selected' => null]);
        return;
    }

    // Extract platform code from generation: "3 Series (E90)" → "E90"
    $platform_code = null;
    if ($generation && preg_match('/\(([A-Z0-9]+)\)/i', $generation, $m)) {
        $platform_code = strtoupper($m[1]);
    }

    // Extract model name from generation: "3 Series (E90)" → "3 Series"
    // Also strip Roman numerals at the end: "Sandero III" → "Sandero"
    $gen_model_name = $generation ? trim(preg_replace('/\s*\(.*$/', '', $generation)) : '';
    $gen_model_base = trim(preg_replace('/\s+(I{1,3}|IV|V|VI{0,3})$/i', '', $gen_model_name));

    // Normalize for matching
    $model_lower = strtolower($model ?: $gen_model_name);
    $model_slug = str_replace(' ', '-', $model_lower);
    $model_base_lower = strtolower($gen_model_base ?: $model_lower);
    $model_base_slug = str_replace(' ', '-', $model_base_lower);

    // Extract year from generation if present
    $year = isset($_GET['year']) && $_GET['year'] !== '' ? intval($_GET['year']) : null;

    $matches = [];
    foreach ($db_gens as $g) {
        $slug = $g['generation_slug'];
        $slug_lower = strtolower($slug);
        $score = 0;

        // Strategy 1: Platform code match (highest priority)
        if ($platform_code && stripos($slug, $platform_code) !== false) {
            $score += 100;
        }

        // Strategy 2: Exact model name match in slug
        if ($model_slug && (strpos($slug_lower, $model_slug) !== false || strpos($slug_lower, $model_lower) !== false)) {
            $score += 50;
        }

        // Strategy 3: Base model name match (without Roman numerals)
        // e.g. "sandero" matches "sandero_sandero-06-2008"
        if ($model_base_slug && $model_base_slug !== $model_slug && strpos($slug_lower, $model_base_slug) !== false) {
            $score += 40;
        }

        // Strategy 4: Partial model word match
        if ($model_lower) {
            $model_words = array_merge(explode(' ', $model_lower), explode('-', $model_slug));
            $model_words = array_unique($model_words);
            foreach ($model_words as $word) {
                $word = trim($word);
                if (strlen($word) >= 3 && strpos($slug_lower, $word) !== false) {
                    $score += 10;
                }
            }
        }

        // Strategy 5: Year range matching from slug
        if ($year && $score > 0) {
            // Try to extract year from slug like "sandero-06-2008" or "sandero-2020"
            if (preg_match('/(\d{4})/', $slug, $ym)) {
                $slug_year = (int)$ym[1];
                if ($slug_year > 1980 && $slug_year < 2030) {
                    if ($year >= $slug_year && $year <= $slug_year + 10) {
                        $score += 20; // Year range bonus
                    }
                }
            }
        }

        if ($score > 0) {
            $matches[] = [
                'generation_slug' => $slug,
                'generation_name' => format_gen_slug($slug),
                'part_count' => (int)$g['part_count'],
                'score' => $score,
            ];
        }
    }

    // Sort by score desc, then part_count desc
    usort($matches, function($a, $b) {
        if ($a['score'] !== $b['score']) return $b['score'] - $a['score'];
        return $b['part_count'] - $a['part_count'];
    });

    // Remove score from output
    $output = [];
    foreach ($matches as $m) {
        unset($m['score']);
        $output[] = $m;
    }

    $auto_selected = !empty($output) ? $output[0]['generation_slug'] : null;

    // If no matches but brand has generations, return all as unmatched fallback
    if (empty($output) && !empty($db_gens)) {
        foreach ($db_gens as $g) {
            $output[] = [
                'generation_slug' => $g['generation_slug'],
                'generation_name' => format_gen_slug($g['generation_slug']),
                'part_count' => (int)$g['part_count'],
            ];
        }
        usort($output, function($a, $b) { return $b['part_count'] - $a['part_count']; });
    }

    echo json_encode(['matches' => $output, 'auto_selected' => $auto_selected]);
}

/**
 * Kiril karakter içeren model isimlerini Latin karşılığına çevirir
 * Eski URL'lerde kalan Kiril metinlerin çalışmasını sağlar
 */
function normalize_cyrillic(string $text): string {
    // Compound ifadeler önce (sıra önemli)
    static $map = [
        'Наклонная задняя часть' => 'Hatchback',
        'Привод на все колеса' => 'AWD',
        'Привод на задние колеса' => 'RWD',
        'c бортовой платформой/ходовая часть' => 'Chassis Cab',
        'с бортовой платформой/ходовая часть' => 'Chassis Cab',
        'бортовой платформой' => 'Flatbed',
        'ходовая часть' => 'Chassis',
        'Одноосный тягач' => 'Tractor',
        'Кабриолет' => 'Cabriolet',
        'Автомобиль' => 'Car',
        'Самосвал' => 'Dump Truck',
        'вездеход' => 'SUV',
        'Вездеход' => 'SUV',
        'универсал' => 'Station Wagon',
        'хетчбэк' => 'Hatchback',
        'закрытый' => 'Closed',
        'открытый' => 'Open',
        'автобус' => 'Bus',
        'Фургон' => 'Van',
        'фургон' => 'Van',
        'бортовой' => 'Flatbed',
        'СЕДАН' => 'Sedan',
        'седан' => 'Sedan',
        'купе' => 'Coupe',
        'Пикап' => 'Pickup',
        'тягач' => 'Tractor',
        'тарга' => 'Targa',
        'Кузов' => 'Body',
        'вэн' => 'Van',
    ];
    return str_replace(array_keys($map), array_values($map), $text);
}

/**
 * Katalog marka adını frontend-uyumlu slug'a çevirir
 * VW → volkswagen, CITROËN → citroen, ALFA ROMEO → alfa-romeo
 */
function catalog_brand_to_slug(string $name): string {
    // Özel eşleştirmeler — slug'ın dosya adlarıyla uyumlu olması için
    static $slug_map = [
        'VW' => 'volkswagen',
        'CITROËN' => 'citroen',
        'ŠKODA' => 'skoda',
        'ŠVENTINĖ' => 'sventine',
        'VW (FAW)' => 'vw-faw',
        'VW (SVW)' => 'vw-svw',
        'CITROËN (DF-PSA)' => 'citroen-df-psa',
        'ŠKODA (SVW)' => 'skoda-svw',
    ];
    $upper = strtoupper(trim($name));
    if (isset($slug_map[$upper])) return $slug_map[$upper];

    $slug = strtolower(trim($name));
    // Diacritics temizle: Ë→e, É→e, Ö→o, Ü→u vb.
    $slug = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $slug) ?: $slug;
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug;
}

function catalog_resolve_brand($pdo, $brand_slug) {
    // Yaygın slug → katalog marka adı eşlemeleri
    static $alias_map = [
        'volkswagen' => 'VW',
        'citroen' => 'CITROËN',
        'mini' => 'MINI',
        'ds' => 'DS',
        'mg' => 'MG',
        'gmc' => 'GMC',
        'bmw' => 'BMW',
        'daf' => 'DAF',
        'man' => 'MAN',
        'nsu' => 'NSU',
        'alfa-romeo' => 'ALFA ROMEO',
        'aston-martin' => 'ASTON MARTIN',
        'land-rover' => 'LAND ROVER',
        'rolls-royce' => 'ROLLS-ROYCE',
        'mercedes-benz' => 'MERCEDES-BENZ',
    ];

    if (isset($alias_map[$brand_slug])) {
        return $alias_map[$brand_slug];
    }

    // catalog_manufacturers tablosundan slug ile marka adı bul
    try {
        $upper = strtoupper(str_replace('-', ' ', $brand_slug));
        $stmt = $pdo->prepare("SELECT name FROM catalog_manufacturers WHERE UPPER(name) = :upper LIMIT 1");
        $stmt->execute([':upper' => $upper]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) return $row['name'];

        // LIKE ile esnek arama
        $like = '%' . str_replace('-', '%', $brand_slug) . '%';
        $stmt = $pdo->prepare("SELECT name FROM catalog_manufacturers WHERE LOWER(name) LIKE LOWER(:like) LIMIT 1");
        $stmt->execute([':like' => $like]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) return $row['name'];
    } catch (PDOException $e) {
        // catalog tablosu yoksa null dön
    }
    return null;
}

function autodata_resolve_brand_name($pdo, $brand_slug) {
    // Map of slug → autodata brand name
    $brand_map = [
        'audi' => 'Audi', 'bmw' => 'BMW', 'volkswagen' => 'Volkswagen',
        'mercedes-benz' => 'Mercedes-Benz', 'skoda' => 'Skoda', 'seat' => 'SEAT',
        'porsche' => 'Porsche', 'volvo' => 'Volvo', 'toyota' => 'Toyota',
        'nissan' => 'Nissan', 'honda' => 'Honda', 'hyundai' => 'Hyundai',
        'kia' => 'Kia', 'ford' => 'Ford', 'renault' => 'Renault',
        'peugeot' => 'Peugeot', 'citroen' => 'Citroen', 'fiat' => 'Fiat',
        'opel' => 'Opel', 'mazda' => 'Mazda', 'subaru' => 'Subaru',
        'suzuki' => 'Suzuki', 'mitsubishi' => 'Mitsubishi', 'chevrolet' => 'Chevrolet',
        'dacia' => 'Dacia', 'mini' => 'MINI', 'alfa-romeo' => 'Alfa Romeo',
        'land-rover' => 'Land Rover', 'jaguar' => 'Jaguar', 'lexus' => 'Lexus',
        'infiniti' => 'Infiniti', 'cupra' => 'Cupra', 'ds' => 'DS',
        'genesis' => 'Genesis', 'tesla' => 'Tesla', 'ferrari' => 'Ferrari',
        'lamborghini' => 'Lamborghini', 'maserati' => 'Maserati',
        'bentley' => 'Bentley', 'aston-martin' => 'Aston Martin',
        'rolls-royce' => 'Rolls-Royce', 'bugatti' => 'Bugatti',
        'abarth' => 'Fiat', 'lancia' => 'Lancia',
    ];

    if (isset($brand_map[$brand_slug])) return $brand_map[$brand_slug];

    // Fallback: try to find brand name from vehicle_specs directly
    try {
        $stmt = $pdo->prepare("SELECT DISTINCT brand FROM vehicle_specs WHERE LOWER(REPLACE(brand, ' ', '-')) = :slug LIMIT 1");
        $stmt->execute([':slug' => $brand_slug]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $row['brand'] : null;
    } catch (PDOException $e) {
        return ucfirst($brand_slug);
    }
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

// ==================== Garage Helpers ====================

/**
 * garage tablosundaki opsiyonel kolonlari kontrol eder, eksikleri ALTER TABLE ile ekler.
 * Donen dizi: ['spec_id' => bool, 'plaka' => bool, 'sase_no' => bool]
 */
function ensure_garage_columns($pdo): array {
    $cols = ['spec_id' => false, 'plaka' => false, 'sase_no' => false];
    try {
        $existing = $pdo->query("SHOW COLUMNS FROM garage")->fetchAll(PDO::FETCH_COLUMN);
        $cols['spec_id'] = in_array('spec_id', $existing);
        $cols['plaka']   = in_array('plaka', $existing);
        $cols['sase_no'] = in_array('sase_no', $existing);
    } catch (PDOException $e) {}

    if (!$cols['plaka']) {
        try { $pdo->exec("ALTER TABLE garage ADD COLUMN plaka VARCHAR(20) DEFAULT NULL"); $cols['plaka'] = true; } catch (PDOException $e) {}
    }
    if (!$cols['sase_no']) {
        try { $pdo->exec("ALTER TABLE garage ADD COLUMN sase_no VARCHAR(50) DEFAULT NULL"); $cols['sase_no'] = true; } catch (PDOException $e) {}
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
        $stmt = $pdo->prepare("SELECT $cols FROM garage WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user_id]);
        $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $today = date('Y-m-d');
        foreach ($vehicles as &$v) {
            $v['id'] = (int)$v['id'];
            $v['year'] = $v['year'] !== null ? (int)$v['year'] : null;
            $v['current_km'] = $v['current_km'] !== null ? (int)$v['current_km'] : null;
            $v['spec_id'] = isset($v['spec_id']) && $v['spec_id'] !== null ? (int)$v['spec_id'] : null;
            if (!isset($v['plaka'])) $v['plaka'] = null;
            if (!isset($v['sase_no'])) $v['sase_no'] = null;

            // Count maintenance stats
            $mstmt = $pdo->prepare('SELECT next_km, next_date FROM vehicle_maintenance WHERE garage_id = ? AND user_id = ?');
            $mstmt->execute([$v['id'], $user_id]);
            $maintenances = $mstmt->fetchAll(PDO::FETCH_ASSOC);

            $overdue = 0; $upcoming = 0;
            foreach ($maintenances as $m) {
                $km_overdue = ($m['next_km'] !== null && $v['current_km'] !== null && (int)$m['next_km'] <= $v['current_km']);
                $date_overdue = ($m['next_date'] !== null && $m['next_date'] <= $today);
                $km_upcoming = ($m['next_km'] !== null && $v['current_km'] !== null && !$km_overdue && ((int)$m['next_km'] - $v['current_km'] <= 1000));
                $date_upcoming = ($m['next_date'] !== null && !$date_overdue && $m['next_date'] <= date('Y-m-d', strtotime('+30 days')));

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

        $brand_slug      = trim($_POST['brand_slug'] ?? '');
        $brand_name      = trim($_POST['brand_name'] ?? '');
        $generation_slug = trim($_POST['generation_slug'] ?? '');
        $generation_name = trim($_POST['generation_name'] ?? '');
        $nickname        = trim($_POST['nickname'] ?? '');
        $year            = isset($_POST['year']) && $_POST['year'] !== '' ? intval($_POST['year']) : null;

        if (!$brand_slug || !$brand_name || !$generation_slug || !$generation_name) {
            http_response_code(400);
            echo json_encode(['error' => 'brand_slug, brand_name, generation_slug ve generation_name zorunludur']);
            return;
        }

        // Prevent duplicate: same brand+generation for same user
        $check = $pdo->prepare('SELECT id FROM garage WHERE user_id = ? AND brand_slug = ? AND generation_slug = ?');
        $check->execute([$user_id, $brand_slug, $generation_slug]);
        if ($check->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Bu arac zaten garajinizda kayitli']);
            return;
        }

        $spec_id = isset($_POST['spec_id']) && $_POST['spec_id'] !== '' ? intval($_POST['spec_id']) : null;
        $plaka   = isset($_POST['plaka']) && trim($_POST['plaka']) !== '' ? strtoupper(trim($_POST['plaka'])) : null;
        $sase_no = isset($_POST['sase_no']) && trim($_POST['sase_no']) !== '' ? strtoupper(trim($_POST['sase_no'])) : null;

        // Opsiyonel kolonlari kontrol et ve eksikleri ekle
        $garageCols = ensure_garage_columns($pdo);
        $hasSpecCol  = $garageCols['spec_id'];
        $hasPlakaCol = $garageCols['plaka'];
        $hasSaseCol  = $garageCols['sase_no'];

        $insertCols = ['user_id', 'brand_slug', 'brand_name', 'generation_slug', 'generation_name', 'year', 'nickname'];
        $insertVals = [$user_id, $brand_slug, $brand_name, $generation_slug, $generation_name, $year, $nickname ?: null];
        if ($hasSpecCol) { $insertCols[] = 'spec_id'; $insertVals[] = $spec_id; }
        if ($hasPlakaCol) { $insertCols[] = 'plaka'; $insertVals[] = $plaka; }
        if ($hasSaseCol) { $insertCols[] = 'sase_no'; $insertVals[] = $sase_no; }

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

// ==================== Rate Limiting ====================

function get_client_ip(): string {
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    return trim(explode(',', $ip)[0]);
}

function check_rate_limit($action, $max_attempts = 5, $window_minutes = 15) {
    $ip = get_client_ip();
    $dir = sys_get_temp_dir() . '/parcabizden_rate';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $file = $dir . '/' . md5($action . '_' . $ip) . '.json';

    $now = time();
    $attempts = [];
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true);
        if (is_array($data)) $attempts = array_filter($data, fn($t) => ($now - $t) < ($window_minutes * 60));
    }

    if (count($attempts) >= $max_attempts) {
        http_response_code(429);
        echo json_encode(['error' => 'Cok fazla deneme. Lutfen ' . $window_minutes . ' dakika bekleyin.']);
        return false;
    }

    $attempts[] = $now;
    @file_put_contents($file, json_encode(array_values($attempts)));
    return true;
}

// ==================== IP Kara Liste Sistemi ====================

function check_ip_blacklist($pdo): bool {
    $ip = get_client_ip();
    try {
        $stmt = $pdo->prepare('SELECT id FROM ip_blacklist WHERE ip = :ip AND expires_at > NOW()');
        $stmt->execute([':ip' => $ip]);
        if ($stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Erisim engellendi. Lutfen daha sonra tekrar deneyin.']);
            return false;
        }
    } catch (PDOException $e) {
        // Tablo yoksa sessizce devam et
        error_log('IP blacklist check error: ' . $e->getMessage());
    }
    return true;
}

function ban_ip($pdo, string $ip, string $reason, int $duration_minutes = 30): void {
    try {
        $stmt = $pdo->prepare('INSERT INTO ip_blacklist (ip, reason, expires_at) VALUES (:ip, :reason, DATE_ADD(NOW(), INTERVAL :minutes MINUTE))');
        $stmt->execute([':ip' => $ip, ':reason' => $reason, ':minutes' => $duration_minutes]);
    } catch (PDOException $e) {
        error_log('IP ban error: ' . $e->getMessage());
    }
}

// ==================== Basarisiz Giris Takibi ====================

function record_failed_login(string $ip, string $email): void {
    $dir = sys_get_temp_dir() . '/parcabizden_failed_logins';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);

    // Loglama
    $logFile = $dir . '/failed_logins.log';
    $logLine = date('Y-m-d H:i:s') . " | IP: $ip | Email: $email\n";
    @file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);

    // IP bazli ardisik basarisiz deneme sayaci
    $counterFile = $dir . '/' . md5('consecutive_' . $ip) . '.json';
    $data = ['count' => 0, 'last_attempt' => 0];
    if (file_exists($counterFile)) {
        $existing = json_decode(file_get_contents($counterFile), true);
        if (is_array($existing)) $data = $existing;
    }
    // 30 dk'dan eski kayitlari sifirla
    if (time() - ($data['last_attempt'] ?? 0) > 1800) {
        $data['count'] = 0;
    }
    $data['count']++;
    $data['last_attempt'] = time();
    @file_put_contents($counterFile, json_encode($data));
}

function get_failed_login_count(string $ip): int {
    $dir = sys_get_temp_dir() . '/parcabizden_failed_logins';
    $counterFile = $dir . '/' . md5('consecutive_' . $ip) . '.json';
    if (!file_exists($counterFile)) return 0;
    $data = json_decode(file_get_contents($counterFile), true);
    if (!is_array($data)) return 0;
    // 30 dk'dan eski kayitlari sifirla
    if (time() - ($data['last_attempt'] ?? 0) > 1800) return 0;
    return (int)($data['count'] ?? 0);
}

function clear_failed_logins(string $ip): void {
    $dir = sys_get_temp_dir() . '/parcabizden_failed_logins';
    $counterFile = $dir . '/' . md5('consecutive_' . $ip) . '.json';
    if (file_exists($counterFile)) @unlink($counterFile);
}

// ==================== Admin Helpers ====================

/**
 * Kullanicinin admin yetkisini kontrol eder; yetkisiz ise 403 donup cikis yapar.
 */
function requireAdmin($db, $userId): void {
    $stmt = $db->prepare('SELECT is_admin FROM users WHERE id = :id');
    $stmt->execute([':id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row || !$row['is_admin']) {
        jsonResponse(['error' => 'Yetkisiz erisim'], 403);
    }
}

// ==================== Admin Audit Log ====================

function admin_audit_log($pdo, int $userId, string $action, ?int $targetId = null, ?string $details = null): void {
    $ip = get_client_ip();
    try {
        $stmt = $pdo->prepare('INSERT INTO admin_audit_log (user_id, action, target_id, details, ip) VALUES (:uid, :action, :tid, :details, :ip)');
        $stmt->execute([':uid' => $userId, ':action' => $action, ':tid' => $targetId, ':details' => $details, ':ip' => $ip]);
    } catch (PDOException $e) {
        error_log('Audit log error: ' . $e->getMessage());
    }
}

// ==================== Auth Handlers ====================

function handle_register($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    if (!check_rate_limit('register', 5, 15)) return;

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

        // Create user — email_verified = 1 (e-posta servisi aktif olunca 0 yapilacak)
        $password_hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        $stmt = $pdo->prepare('INSERT INTO users (email, password_hash, name, phone, email_verified) VALUES (?, ?, ?, ?, 1)');
        $stmt->execute([$email, $password_hash, $name, $phone ?: null]);
        $user_id = (int)$pdo->lastInsertId();

        $token = jwt_encode(['user_id' => $user_id]);
        echo json_encode([
            'success' => true,
            'message' => 'Kayit basarili!',
            'token' => $token,
            'user' => ['id' => $user_id, 'email' => $email, 'name' => $name, 'phone' => $phone ?: null]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Kayit hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'Kayıt sırasında bir hata oluştu.']);
    }
}

function handle_login($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    if (!check_rate_limit('login', 5, 15)) return;

    $ip = get_client_ip();

    // Brute-force kontrolu: 5 ardisik basarisiz → 30dk ban
    $failCount = get_failed_login_count($ip);
    if ($failCount >= 5) {
        ban_ip($pdo, $ip, 'brute_force_login', 30);
        http_response_code(403);
        echo json_encode(['error' => 'Cok fazla basarisiz giris denemesi. IP adresiniz 30 dakika engellendi.']);
        return;
    }

    try {
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (!$email || !$password) { http_response_code(400); echo json_encode(['error' => 'E-posta ve sifre gerekli']); return; }

        $stmt = $pdo->prepare('SELECT id, email, password_hash, name, phone, email_verified, is_admin FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            record_failed_login($ip, $email);

            // Admin kullanici icin 3 basarisiz → 60 dk ban
            if ($user && !empty($user['is_admin'])) {
                $currentFails = get_failed_login_count($ip);
                if ($currentFails >= 3) {
                    ban_ip($pdo, $ip, 'brute_force_admin', 60);
                    http_response_code(403);
                    echo json_encode(['error' => 'Admin hesabina cok fazla basarisiz giris. IP adresiniz 60 dakika engellendi.']);
                    return;
                }
            }

            http_response_code(401); echo json_encode(['error' => 'E-posta veya sifre hatali']); return;
        }

        // Basarili giris — sayaci sifirla
        clear_failed_logins($ip);

        // E-posta dogrulama kontrolu devre disi (e-posta servisi aktif olunca acilacak)
        // if (!$user['email_verified']) { ... }

        $token = jwt_encode(['user_id' => $user['id']]);
        echo json_encode([
            'message' => 'Giris basarili',
            'token' => $token,
            'user' => ['id' => (int)$user['id'], 'email' => $user['email'], 'name' => $user['name'], 'phone' => $user['phone'], 'is_admin' => (bool)($user['is_admin'] ?? false)]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Login hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'Giriş sırasında bir hata oluştu.']);
    }
}

function handle_profile($pdo) {
    try {
        $user_id = get_auth_user_id();
        if (!$user_id) { http_response_code(401); echo json_encode(['error' => 'Oturum gecersiz']); return; }

        $stmt = $pdo->prepare('SELECT id, email, name, phone, gsm, address_line1, address_line2, city, district, postal_code, tc_no, is_admin FROM users WHERE id = ?');
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) { http_response_code(404); echo json_encode(['error' => 'Kullanici bulunamadi']); return; }

        echo json_encode(['user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'phone' => $user['phone'],
            'gsm' => $user['gsm'] ?? null,
            'address_line1' => $user['address_line1'] ?? null,
            'address_line2' => $user['address_line2'] ?? null,
            'city' => $user['city'] ?? null,
            'district' => $user['district'] ?? null,
            'postal_code' => $user['postal_code'] ?? null,
            'tc_no' => $user['tc_no'] ?? null,
            'is_admin' => (bool)($user['is_admin'] ?? false),
        ]]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Profil hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'Profil bilgileri yüklenirken bir hata oluştu.']);
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
        error_log('Dogrulama hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'Doğrulama sırasında bir hata oluştu.']);
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
        error_log('Resend hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'İşlem sırasında bir hata oluştu.']);
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
        error_log('Sifre sifirlama hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'Şifre sıfırlama sırasında bir hata oluştu.']);
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
        error_log('Sifre degistirme hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'Şifre değiştirme sırasında bir hata oluştu.']);
    }
}

// ==================== E-posta Gönderimi (SMTP AUTH) ====================
// Natro cPanel'den noreply@parcabizden.com.tr e-posta hesabı oluşturun
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'mail.parcabizden.com.tr');
define('SMTP_PORT', (int)(getenv('SMTP_PORT') ?: 587));
define('SMTP_USER', getenv('SMTP_USER') ?: 'noreply@parcabizden.com.tr');
define('SMTP_PASS', getenv('SMTP_PASS') ?: '');
define('SMTP_FROM_NAME', 'ParcaBizden');

function smtp_send($to, $subject_text, $html_body) {
    $from = SMTP_USER;
    $subject = '=?UTF-8?B?' . base64_encode($subject_text) . '?=';

    // Build full email message
    $msg  = "From: " . SMTP_FROM_NAME . " <$from>\r\n";
    $msg .= "To: $to\r\n";
    $msg .= "Subject: $subject\r\n";
    $msg .= "MIME-Version: 1.0\r\n";
    $msg .= "Content-Type: text/html; charset=UTF-8\r\n";
    $msg .= "Content-Transfer-Encoding: base64\r\n";
    $msg .= "\r\n";
    $msg .= chunk_split(base64_encode($html_body));

    // Connect to SMTP
    $sock = @fsockopen(SMTP_HOST, SMTP_PORT, $errno, $errstr, 10);
    if (!$sock) {
        // Try SSL on 465
        $sock = @fsockopen('ssl://' . SMTP_HOST, 465, $errno, $errstr, 10);
    }
    if (!$sock) {
        @file_put_contents(__DIR__ . '/email_debug.log',
            date('Y-m-d H:i:s') . " CONNECT FAIL: $errstr ($errno)\n", FILE_APPEND);
        return false;
    }

    $log = '';
    $read = function() use ($sock, &$log) {
        $r = ''; $t = 0;
        while ($t < 10) {
            $line = @fgets($sock, 512);
            if ($line === false) break;
            $r .= $line;
            if (isset($line[3]) && $line[3] === ' ') break; // last line of multi-line
            $t++;
        }
        $log .= "S: $r";
        return $r;
    };
    $write = function($cmd) use ($sock, &$log) {
        // Don't log password
        if (stripos($cmd, 'AUTH') !== false || strlen($cmd) > 50) {
            $log .= "C: [hidden]\n";
        } else {
            $log .= "C: $cmd";
        }
        @fwrite($sock, $cmd);
    };

    $resp = $read();
    if (substr($resp, 0, 3) !== '220') { @fclose($sock); return false; }

    // EHLO
    $write("EHLO parcabizden.com.tr\r\n");
    $ehlo_resp = $read();

    // STARTTLS if available
    if (stripos($ehlo_resp, 'STARTTLS') !== false && SMTP_PORT == 587) {
        $write("STARTTLS\r\n");
        $resp = $read();
        if (substr($resp, 0, 3) === '220') {
            stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            // Re-EHLO after TLS
            $write("EHLO parcabizden.com.tr\r\n");
            $read();
        }
    }

    // AUTH LOGIN
    $write("AUTH LOGIN\r\n");
    $resp = $read();
    if (substr($resp, 0, 3) !== '334') {
        @file_put_contents(__DIR__ . '/email_debug.log',
            date('Y-m-d H:i:s') . " AUTH NOT SUPPORTED\n$log\n", FILE_APPEND);
        @fwrite($sock, "QUIT\r\n"); @fclose($sock); return false;
    }
    $write(base64_encode(SMTP_USER) . "\r\n");
    $resp = $read();
    $write(base64_encode(SMTP_PASS) . "\r\n");
    $resp = $read();
    if (substr($resp, 0, 3) !== '235') {
        @file_put_contents(__DIR__ . '/email_debug.log',
            date('Y-m-d H:i:s') . " AUTH FAILED\n$log\n", FILE_APPEND);
        @fwrite($sock, "QUIT\r\n"); @fclose($sock); return false;
    }

    // MAIL FROM
    $write("MAIL FROM:<$from>\r\n");
    $resp = $read();
    if (substr($resp, 0, 3) !== '250') { @fwrite($sock, "QUIT\r\n"); @fclose($sock); return false; }

    // RCPT TO
    $write("RCPT TO:<$to>\r\n");
    $resp = $read();
    if (substr($resp, 0, 3) !== '250') { @fwrite($sock, "QUIT\r\n"); @fclose($sock); return false; }

    // DATA
    $write("DATA\r\n");
    $resp = $read();
    if (substr($resp, 0, 3) !== '354') { @fwrite($sock, "QUIT\r\n"); @fclose($sock); return false; }

    @fwrite($sock, $msg . "\r\n.\r\n");
    $resp = $read();
    $write("QUIT\r\n");
    @fclose($sock);

    $code = (int)substr($resp, 0, 3);
    if ($code >= 200 && $code < 300) return true;

    @file_put_contents(__DIR__ . '/email_debug.log',
        date('Y-m-d H:i:s') . " SEND FAIL code=$code\n$log\n", FILE_APPEND);
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
    $verify_token = getenv('WHATSAPP_WEBHOOK_VERIFY') ?: 'parcabizden_webhook_2024';
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
