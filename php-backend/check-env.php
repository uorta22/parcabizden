<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$envPath = __DIR__ . '/.env';
$result = [
    'env_exists' => file_exists($envPath),
    'env_readable' => is_readable($envPath),
    'env_size' => file_exists($envPath) ? filesize($envPath) : 0,
    'php_version' => PHP_VERSION,
    'dir' => __DIR__,
    'files' => array_values(array_filter(scandir(__DIR__), function($f) { return $f[0] !== '.'; })),
];

if (file_exists($envPath) && is_readable($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $keys = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        [$key, ] = explode('=', $line, 2);
        $keys[] = trim($key);
    }
    $result['env_keys'] = $keys;
    $result['env_line_count'] = count($lines);
}

echo json_encode($result, JSON_PRETTY_PRINT);
