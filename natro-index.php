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

// Üç yüzey, üç alan adı — tek tek yazılıyor.
// WILDCARD KULLANILMIYOR (*.parcabizden.com.tr gibi): atıl bir alt alan adı
// ele geçirilirse (dangling DNS) doğrudan API'ye erişim kazanırdı.
$_allowed_origins = [
    'https://parcabizden.com.tr',
    'https://www.parcabizden.com.tr',
    'https://pazaryeri.parcabizden.com.tr',
    'https://talep.parcabizden.com.tr',
];
$_req_origin = $_SERVER['HTTP_ORIGIN'] ?? '';
// Vercel preview URL'leri: parcabizden-<hash>-<takim>.vercel.app veya
// parcabizden-git-<branch>-<takim>.vercel.app
//
// Onceki desen HERHANGI bir *.vercel.app origin'ini kabul ediyordu; yani
// saldirgan kendi projesini deploy edip API'yi cross-origin okuyabiliyordu.
// Artik yalnizca bu projenin adiyla baslayan deployment'lar geciyor.
// Not: baska bir Vercel takimi da projesine 'parcabizden' adini verebilir;
// tam kapatmak icin desene kendi takim slug'inizi ekleyin.
if (in_array($_req_origin, $_allowed_origins, true)
    || (strlen($_req_origin) < 200 && preg_match('/^https:\/\/parcabizden(-[a-z0-9-]+)?\.vercel\.app$/i', $_req_origin))
) {
    header('Access-Control-Allow-Origin: ' . $_req_origin);
    header('Vary: Origin');
} else {
    header('Access-Control-Allow-Origin: https://parcabizden.com.tr');
}
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
$auth_actions = ['register', 'login', 'profile', 'verify_email', 'resend_verify', 'forgot_password', 'reset_password', 'garage_list', 'garage_add', 'garage_remove', 'garage_update', 'maintenance_list', 'maintenance_add', 'maintenance_update', 'maintenance_remove', 'profile_update', 'address_list', 'address_add', 'address_update', 'address_remove', 'order_list', 'order_detail', 'order_create', 'favorite_list', 'favorite_add', 'favorite_remove', 'change_password', 'delete_account', 'admin_product_add', 'admin_product_update', 'admin_product_delete', 'admin_set_default_thumbnails', 'admin_order_list', 'admin_order_update_status', 'admin_enrich_part', 'seller_register', 'seller_me', 'seller_update', 'admin_seller_list', 'admin_seller_decide', 'admin_seller_document', 'listing_create', 'listing_mine', 'listing_set_status', 'listing_confirm', 'request_mine', 'seller_requests', 'offer_create', 'offer_withdraw', 'offer_mine'];
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
    'tecdoc.php',         // [V2 — TecDoc ID zinciri] tecdoc_brands/models/vehicles/vehicle_attributes/vehicle_categories/vehicle_parts/search/part_detail
    'garage.php',         // ensure_garage_columns, handle_garage_*, handle_maintenance_*
    'chat.php',           // handle_chat, send_whatsapp, handle_chat_messages, handle_chat_webhook
    'profile.php',        // handleProfileUpdate
    'password.php',       // handleChangePassword, handleDeleteAccount
    'sellers.php',        // [PAZARYERI] handle_seller_register/me/update, handle_admin_seller_list/decide/document, handle_geo_cities/districts
    'listings.php',       // [PAZARYERI] handle_listing_create/mine/detail/search/set_status/confirm
    'requests.php',       // [PAZARYERI] handle_request_create/detail/mine/close, handle_seller_requests
    'offers.php',         // [PAZARYERI] handle_offer_create/withdraw/mine/decide
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
    // ── TecDoc V2 — ID tabanlı temiz zincir ──
    case 'tecdoc_brands':              tecdoc_brands($pdo); break;
    case 'tecdoc_models':              tecdoc_models($pdo); break;
    case 'tecdoc_vehicles':            tecdoc_vehicles($pdo); break;
    case 'tecdoc_vehicle_attributes':  tecdoc_vehicle_attributes($pdo); break;
    case 'register':      handle_register($pdo); break;
    case 'login':         handle_login($pdo); break;
    case 'profile':       handle_profile($pdo); break;
    case 'verify_email':  handle_verify_email($pdo); break;
    case 'resend_verify':   handle_resend_verify($pdo); break;
    case 'forgot_password': handle_forgot_password($pdo); break;
    case 'reset_password':  handle_reset_password($pdo); break;


    // ── E-Commerce: Profile (auth) ──
    case 'profile_update':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleProfileUpdate($pdo, $uid); break;

    // ── E-Commerce: Password & Account (auth) ──
    case 'change_password':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleChangePassword($pdo, $uid); break;
    case 'delete_account':
        $uid = get_auth_user_id(); if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        handleDeleteAccount($pdo, $uid); break;

    // ── Pazaryeri: coğrafya (herkese açık) ──
    case 'geo_cities':    handle_geo_cities($pdo); break;
    case 'geo_districts': handle_geo_districts($pdo); break;

    // ── Pazaryeri: satıcı (auth) ──
    case 'seller_register':
    case 'seller_me':
    case 'seller_update':
        $uid = get_auth_user_id();
        if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        match ($action) {
            'seller_register' => handle_seller_register($pdo, $uid),
            'seller_me'       => handle_seller_me($pdo, $uid),
            'seller_update'   => handle_seller_update($pdo, $uid),
        };
        break;

    // ── Pazaryeri: ilan (herkese açık okuma) ──
    case 'listing_search': handle_listing_search($pdo); break;
    case 'listing_detail': handle_listing_detail($pdo); break;

    // ── Pazaryeri: ilan (satıcı) ──
    case 'listing_create':
    case 'listing_mine':
    case 'listing_set_status':
    case 'listing_confirm':
        $uid = get_auth_user_id();
        if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        match ($action) {
            'listing_create'     => handle_listing_create($pdo, $uid),
            'listing_mine'       => handle_listing_mine($pdo, $uid),
            'listing_set_status' => handle_listing_set_status($pdo, $uid),
            'listing_confirm'    => handle_listing_confirm($pdo, $uid),
        };
        break;

    // ── Pazaryeri: talep (misafir açabilir; erişim anahtarı ile okunur) ──
    case 'request_create': handle_request_create($pdo); break;
    case 'request_detail': handle_request_detail($pdo); break;
    case 'request_close':  handle_request_close($pdo); break;
    case 'offer_decide':   handle_offer_decide($pdo); break;

    // ── Pazaryeri: talep/teklif (giriş gerekli) ──
    case 'request_mine':
    case 'seller_requests':
    case 'offer_create':
    case 'offer_withdraw':
    case 'offer_mine':
        $uid = get_auth_user_id();
        if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        match ($action) {
            'request_mine'    => handle_request_mine($pdo, $uid),
            'seller_requests' => handle_seller_requests($pdo, $uid),
            'offer_create'    => handle_offer_create($pdo, $uid),
            'offer_withdraw'  => handle_offer_withdraw($pdo, $uid),
            'offer_mine'      => handle_offer_mine($pdo, $uid),
        };
        break;

    // ── Pazaryeri: satıcı onay kuyruğu (admin) ──
    case 'admin_seller_list':
    case 'admin_seller_decide':
    case 'admin_seller_document':
        $uid = get_auth_user_id();
        if (!$uid) { http_response_code(401); echo json_encode(['error'=>'Oturum gecersiz']); break; }
        requireAdmin($pdo, $uid);
        if (!check_rate_limit('admin_seller', 60, 15)) break;
        match ($action) {
            'admin_seller_list'     => handle_admin_seller_list($pdo),
            'admin_seller_decide'   => handle_admin_seller_decide($pdo, $uid),
            'admin_seller_document' => handle_admin_seller_document($pdo),
        };
        break;

    default: echo json_encode(['error' => 'Invalid action']);
}
