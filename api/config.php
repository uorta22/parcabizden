<?php
// Load environment variables from .env file if it exists
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if (!array_key_exists($key, $_ENV) && !array_key_exists($key, $_SERVER)) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
}

// MySQL Database Configuration (auth, garage, users)
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'parcabizden');
define('DB_USER', getenv('DB_USER') ?: '');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', getenv('DB_CHARSET') ?: 'utf8mb4');

// SQLite Catalog Database (parts, vehicles, manufacturers)
define('CATALOG_DB_PATH', getenv('CATALOG_DB_PATH') ?: __DIR__ . '/parcabizden_v3.db');

// JWT Configuration - Using environment variables with fallbacks
define('JWT_SECRET', getenv('JWT_SECRET') ?: '');
define('JWT_EXPIRY', 86400); // 24 hours (reduced from 7 days for security)

// API Configuration
define('API_VERSION', '1.0');
define('ITEMS_PER_PAGE', 20);

// Error reporting (disable display in production, enable logging)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', getenv('ERROR_LOG_PATH') ?: __DIR__ . '/logs/php_errors.log');

// Timezone
date_default_timezone_set('Europe/Istanbul');

// CORS Configuration - Allow multiple origins (Vercel + production domain)
$allowedOrigins = array_filter([
    getenv('ALLOWED_ORIGIN') ?: 'https://parcabizden.com.tr',
    'https://parcabizden.com.tr',
    'https://www.parcabizden.com.tr',
]);

// Handle CORS headers
header('Content-Type: application/json; charset=utf-8');

// Check if Origin header matches any allowed origin
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$originAllowed = false;

if (in_array($requestOrigin, $allowedOrigins, true)) {
    $originAllowed = true;
} elseif ($requestOrigin && strpos($requestOrigin, 'localhost') !== false && getenv('APP_ENV') !== 'production') {
    $originAllowed = true;
} elseif ($requestOrigin && strpos($requestOrigin, '.vercel.app') !== false) {
    // Allow Vercel preview deployments
    $originAllowed = true;
}

if ($originAllowed) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
} else {
    header('Access-Control-Allow-Origin: https://parcabizden.com.tr');
}

header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Security Headers
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
