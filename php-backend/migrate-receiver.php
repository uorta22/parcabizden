<?php
/**
 * Migration Receiver — POST ile gelen SQL batch'lerini MySQL'e yazar
 * Lokal makineden HTTP üzerinden veri aktarımı için
 */
define('SECURITY_TOKEN', 'pBzD_import_2026_xK9');

$token = $_GET['token'] ?? $_POST['token'] ?? '';
if ($token !== SECURITY_TOKEN) {
    http_response_code(403);
    die(json_encode(['error' => 'Geçersiz token']));
}

header('Content-Type: application/json; charset=utf-8');

// .env
$envPath = __DIR__ . '/.env';
$env = [];
if (file_exists($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        [$key, $val] = explode('=', $line, 2);
        $env[trim($key)] = trim($val);
    }
}

try {
    $pdo = new PDO(
        "mysql:host={$env['DB_HOST']};dbname={$env['DB_NAME']};charset=utf8mb4",
        $env['DB_USER'], $env['DB_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => true]
    );
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("SET UNIQUE_CHECKS = 0");
    $pdo->exec("SET AUTOCOMMIT = 0");
} catch (PDOException $e) {
    die(json_encode(['error' => 'DB bağlantı hatası: ' . $e->getMessage()]));
}

$action = $_GET['action'] ?? 'status';

if ($action === 'status') {
    $tables = $pdo->query("SHOW TABLES LIKE 'catalog_%'")->fetchAll(PDO::FETCH_COLUMN);
    $result = [];
    foreach ($tables as $t) {
        $result[$t] = (int)$pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
    }
    echo json_encode(['status' => 'ok', 'tables' => $result]);
    exit;
}

if ($action === 'exec' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $sql = file_get_contents('php://input');
    if (empty($sql)) {
        die(json_encode(['error' => 'Boş SQL']));
    }

    $errors = [];
    $executed = 0;

    // Birden fazla statement çalıştır
    $statements = array_filter(array_map('trim', explode(";\n", $sql)));
    foreach ($statements as $stmt) {
        $stmt = trim($stmt);
        if (empty($stmt) || strpos($stmt, '--') === 0) continue;
        try {
            $pdo->exec($stmt);
            $executed++;
        } catch (PDOException $e) {
            $errors[] = substr($e->getMessage(), 0, 150);
            if (count($errors) > 3) break;
        }
    }
    $pdo->exec("COMMIT");

    echo json_encode([
        'executed' => $executed,
        'errors' => count($errors),
        'error_details' => $errors,
    ]);
    exit;
}

echo json_encode(['error' => 'Geçersiz action']);
