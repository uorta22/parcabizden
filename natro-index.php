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
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
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

// ==================== E-posta SMTP Sabitleri ====================
// Natro cPanel'den noreply@parcabizden.com.tr e-posta hesabı oluşturun
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'mail.parcabizden.com.tr');
define('SMTP_PORT', (int)(getenv('SMTP_PORT') ?: 587));
define('SMTP_USER', getenv('SMTP_USER') ?: 'noreply@parcabizden.com.tr');
define('SMTP_PASS', getenv('SMTP_PASS') ?: '');
define('SMTP_FROM_NAME', 'ParcaBizden');

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

// Include modüller — yükleme sırası önemli:
// security + auth önce (diğer modüller bunlara bağımlı)
$_pb_modules = [
    'security.php',       // get_client_ip, check_rate_limit, check_ip_blacklist, ban_ip, record_failed_login, admin_audit_log
    'auth.php',           // jwt_encode, jwt_decode, get_auth_user_id, requireAdmin, handle_register, handle_login, ...
    'email.php',          // smtp_send, send_verification_email, send_reset_email
    'catalog.php',        // clean_text, format_gen_slug, get_categories, get_parts, search_oem, get_brands, get_generations, vin_decode
    'autodata.php',       // handle_vehicle_specs, handle_autodata_*, normalize_cyrillic, catalog_brand_to_slug, catalog_resolve_brand
    'garage.php',         // ensure_garage_columns, handle_garage_*, handle_maintenance_*
    'chat.php',           // handle_chat, send_whatsapp, handle_chat_messages, handle_chat_webhook
    'products.php',       // handleProductList, handleProductDetail, handleProductSearch
    'orders.php',         // handleOrderList, handleOrderDetail, handleOrderCreate
    'addresses.php',      // handleAddressList, handleAddressAdd, handleAddressUpdate, handleAddressRemove
    'favorites.php',      // handleFavoriteList, handleFavoriteAdd, handleFavoriteRemove
    'profile.php',        // handleProfileUpdate
    'password.php',       // handleChangePassword, handleDeleteAccount
    'admin-products.php', // handleAdminProductAdd, handleAdminProductUpdate, handleAdminProductDelete, handleAdminSetDefaultThumbnails, handleAdminEnrichPart
    'admin-orders.php',   // handleAdminOrderList, handleAdminOrderUpdateStatus
];
foreach ($_pb_modules as $_m) {
    $__f = __DIR__ . '/' . $_m;
    if (file_exists($__f)) require_once $__f;
}

// CSRF koruması — POST isteklerinde custom header zorunlu
// Tarayıcılar cross-site form submission'larda custom header gönderemez
// Webhook endpoint'leri hariç (dış servislerden gelir)
$csrf_exempt = ['chat_webhook'];
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !in_array($action_check, $csrf_exempt)) {
    $xrw = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    if ($xrw !== 'XMLHttpRequest') {
        http_response_code(403);
        echo json_encode(['error' => 'Geçersiz istek']);
        exit;
    }
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

    // ── Admin: Merkezi auth + admin kontrolü ──
    case 'admin_product_add':
    case 'admin_product_update':
    case 'admin_product_delete':
    case 'admin_set_default_thumbnails':
    case 'admin_order_list':
    case 'admin_order_update_status':
    case 'admin_enrich_part':
        $uid = get_auth_user_id();
        if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        requireAdmin($pdo, $uid);
        $adminRateLimits = [
            'admin_order_list' => ['admin_order_list', 60, 15],
            'admin_order_update_status' => ['admin_order_update', 30, 15],
        ];
        $rl = $adminRateLimits[$action] ?? ['admin_product_write', 30, 15];
        if (!check_rate_limit($rl[0], $rl[1], $rl[2])) break;
        match ($action) {
            'admin_product_add' => handleAdminProductAdd($pdo, $uid),
            'admin_product_update' => handleAdminProductUpdate($pdo, $uid),
            'admin_product_delete' => handleAdminProductDelete($pdo, $uid),
            'admin_set_default_thumbnails' => handleAdminSetDefaultThumbnails($pdo, $uid),
            'admin_order_list' => handleAdminOrderList($pdo, $uid),
            'admin_order_update_status' => handleAdminOrderUpdateStatus($pdo, $uid),
            'admin_enrich_part' => handleAdminEnrichPart($pdo, $uid),
        };
        break;

    default: echo json_encode(['error' => 'Invalid action']);
}
