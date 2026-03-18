<?php
// Basit sunucu sağlık kontrolü — sorun teşhisi için
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$checks = [
    'php_version' => PHP_VERSION,
    'php_sapi' => php_sapi_name(),
    'env_file_exists' => file_exists(__DIR__ . '/.env'),
    'index_file_exists' => file_exists(__DIR__ . '/index.php'),
    'index_file_size' => file_exists(__DIR__ . '/index.php') ? filesize(__DIR__ . '/index.php') : 0,
    'error_reporting' => error_reporting(),
    'display_errors' => ini_get('display_errors'),
    'pdo_drivers' => PDO::getAvailableDrivers(),
    'loaded_extensions' => get_loaded_extensions(),
    'timestamp' => date('Y-m-d H:i:s'),
];

// .env okunabiliyor mu?
if ($checks['env_file_exists']) {
    $envContent = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $envKeys = [];
    foreach ($envContent as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        [$key, ] = explode('=', $line, 2);
        $envKeys[] = trim($key);
    }
    $checks['env_keys'] = $envKeys;
}

// MySQL bağlantısı test
try {
    $envContent = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $env = [];
    foreach ($envContent as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        [$key, $val] = explode('=', $line, 2);
        $env[trim($key)] = trim($val);
    }
    $pdo = new PDO(
        "mysql:host={$env['DB_HOST']};dbname={$env['DB_NAME']};charset=utf8mb4",
        $env['DB_USER'],
        $env['DB_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $checks['mysql_connection'] = 'OK';
    $checks['mysql_server_version'] = $pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
} catch (PDOException $e) {
    $checks['mysql_connection'] = 'FAILED';
    $checks['mysql_error'] = $e->getMessage();
}

// index.php syntax check
$syntaxOutput = [];
$syntaxReturn = 0;
exec('php -l ' . escapeshellarg(__DIR__ . '/index.php') . ' 2>&1', $syntaxOutput, $syntaxReturn);
$checks['index_syntax_check'] = implode("\n", $syntaxOutput);
$checks['index_syntax_ok'] = $syntaxReturn === 0;

echo json_encode($checks, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
