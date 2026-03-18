<?php
/**
 * SQLite → MySQL Direkt Migration
 * parcabizden_v3.db dosyasından catalog_* tablolarına veri aktarır
 * Sunucuda çalışır — FTP'ye gerek yok
 *
 * Kullanım: https://api.parcabizden.com.tr/migrate-catalog.php?token=TOKEN&table=TABLE&offset=0
 * GÜVENLİK: Bitince bu dosyayı sunucudan SİLİN!
 */

// Ayarlar
define('SECURITY_TOKEN', 'pBzD_import_2026_xK9');
define('BATCH_SIZE', 5000);         // Her oturumda aktarılacak satır
define('SQLITE_PATH', __DIR__ . '/parcabizden_v3.db');

// Güvenlik
$token = $_GET['token'] ?? '';
if ($token !== SECURITY_TOKEN) {
    http_response_code(403);
    die(json_encode(['error' => 'Geçersiz token']));
}

header('Content-Type: text/html; charset=utf-8');

// .env'den DB bilgileri
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

// Tablo tanımları: sqlite_table => [mysql_table, columns, has_autoincrement]
$TABLE_MAP = [
    'cross_ref' => [
        'mysql' => 'catalog_cross_ref',
        'columns' => 'supplier_id, part_number, ref_supplier_id, ref_part_number, ref_type',
        'placeholders' => '?, ?, ?, ?, ?',
        'count_col' => 'supplier_id',
    ],
    'vehicle_attributes' => [
        'mysql' => 'catalog_vehicle_attributes',
        'columns' => 'vehicle_id, attribute_group, attribute_type, display_title, display_value',
        'placeholders' => '?, ?, ?, ?, ?',
        'count_col' => 'vehicle_id',
    ],
    'parts' => [
        'mysql' => 'catalog_parts',
        'columns' => 'id, supplier_id, part_number',
        'placeholders' => '?, ?, ?',
        'count_col' => 'id',
    ],
    'part_images' => [
        'mysql' => 'catalog_part_images',
        'columns' => 'supplier_id, part_number, picture_name, doc_type',
        'placeholders' => '?, ?, ?, ?',
        'count_col' => 'supplier_id',
    ],
    'part_vehicles' => [
        'mysql' => 'catalog_part_vehicles',
        'columns' => 'part_id, vehicle_id, category_id',
        'placeholders' => '?, ?, ?',
        'count_col' => 'part_id',
    ],
];

$action = $_GET['action'] ?? 'status';
$table = $_GET['table'] ?? '';
$offset = max(0, (int)($_GET['offset'] ?? 0));

?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Katalog Migration</title>
    <style>
        body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; background: #f5f5f5; }
        h1 { color: #1a1a1a; }
        .card { background: white; border-radius: 8px; padding: 20px; margin: 16px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .btn { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; text-decoration: none; display: inline-block; font-size: 14px; }
        .btn:hover { background: #1d4ed8; }
        .progress { background: #e5e7eb; border-radius: 999px; height: 28px; overflow: hidden; margin: 16px 0; }
        .progress-bar { background: #2563eb; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: bold; min-width: 50px; transition: width 0.3s; }
        .ok { background: #d1fae5; color: #065f46; padding: 12px; border-radius: 6px; margin: 8px 0; }
        .err { background: #fee2e2; color: #991b1b; padding: 12px; border-radius: 6px; margin: 8px 0; }
        .info { background: #dbeafe; color: #1e40af; padding: 12px; border-radius: 6px; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { font-weight: 600; color: #374151; }
        .meta { color: #6b7280; font-size: 13px; }
    </style>
</head>
<body>
<h1>Katalog DB Migration</h1>

<?php
// SQLite kontrol
$sqliteOk = file_exists(SQLITE_PATH);
$sqliteSize = $sqliteOk ? round(filesize(SQLITE_PATH) / (1024*1024*1024), 2) : 0;
$hasSqliteExt = extension_loaded('sqlite3') || extension_loaded('pdo_sqlite');

if (!$sqliteOk) {
    echo '<div class="err">parcabizden_v3.db bulunamadı: ' . SQLITE_PATH . '</div>';
    echo '</body></html>';
    exit;
}
if (!$hasSqliteExt) {
    echo '<div class="err">PHP SQLite uzantısı yüklü değil! (pdo_sqlite veya sqlite3 gerekli)</div>';
    echo '</body></html>';
    exit;
}

// MySQL bağlantısı
try {
    $mysql = new PDO(
        "mysql:host={$env['DB_HOST']};dbname={$env['DB_NAME']};charset=utf8mb4",
        $env['DB_USER'], $env['DB_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    echo '<div class="err">MySQL bağlantı hatası: ' . htmlspecialchars($e->getMessage()) . '</div>';
    echo '</body></html>';
    exit;
}

// SQLite bağlantısı
try {
    $sqlite = new PDO('sqlite:' . SQLITE_PATH);
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $sqlite->exec('PRAGMA cache_size = -32000');
    $sqlite->exec('PRAGMA mmap_size = 134217728');
} catch (PDOException $e) {
    echo '<div class="err">SQLite bağlantı hatası: ' . htmlspecialchars($e->getMessage()) . '</div>';
    echo '</body></html>';
    exit;
}

if ($action === 'status' || $action === 'list'):
?>
    <div class="card">
        <h2>Durum</h2>
        <p class="meta">SQLite: <?= SQLITE_PATH ?> (<?= $sqliteSize ?> GB)</p>
        <table>
            <tr><th>Tablo</th><th>SQLite</th><th>MySQL</th><th>Durum</th><th></th></tr>
            <?php foreach ($TABLE_MAP as $key => $def):
                $sqliteCount = $sqlite->query("SELECT COUNT(*) FROM {$key}")->fetchColumn();
                $mysqlCount = $mysql->query("SELECT COUNT(*) FROM {$def['mysql']}")->fetchColumn();
                $pct = $sqliteCount > 0 ? round(($mysqlCount / $sqliteCount) * 100, 1) : 0;
                $done = $mysqlCount >= $sqliteCount;
            ?>
            <tr>
                <td><strong><?= $def['mysql'] ?></strong></td>
                <td><?= number_format($sqliteCount) ?></td>
                <td><?= number_format($mysqlCount) ?></td>
                <td><?= $done ? '<span style="color:#059669">✓ Tamam</span>' : "<span style='color:#d97706'>{$pct}%</span>" ?></td>
                <td>
                    <?php if (!$done): ?>
                        <a href="?token=<?= SECURITY_TOKEN ?>&action=migrate&table=<?= $key ?>&offset=<?= $mysqlCount ?>" class="btn">
                            <?= $mysqlCount > 0 ? 'Devam Et' : 'Başlat' ?>
                        </a>
                    <?php endif; ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
    </div>

<?php elseif ($action === 'migrate' && isset($TABLE_MAP[$table])):
    $def = $TABLE_MAP[$table];
    $totalRows = $sqlite->query("SELECT COUNT(*) FROM {$table}")->fetchColumn();
    $columns = explode(', ', $def['columns']);
    $colStr = $def['columns'];
    $placeholders = $def['placeholders'];

    // MySQL optimize
    $mysql->exec("SET FOREIGN_KEY_CHECKS = 0");
    $mysql->exec("SET UNIQUE_CHECKS = 0");
    $mysql->exec("SET AUTOCOMMIT = 0");

    // SQLite'dan oku
    $stmt = $sqlite->prepare("SELECT {$colStr} FROM {$table} LIMIT :limit OFFSET :offset");
    $stmt->bindValue(':limit', BATCH_SIZE, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_NUM);
    $rowCount = count($rows);

    // MySQL'e yaz — multi-row INSERT
    $errors = [];
    if ($rowCount > 0) {
        $chunkSize = 500;
        for ($i = 0; $i < $rowCount; $i += $chunkSize) {
            $chunk = array_slice($rows, $i, $chunkSize);
            $valuesArr = [];
            $params = [];
            foreach ($chunk as $row) {
                $valuesArr[] = "({$placeholders})";
                foreach ($row as $val) {
                    $params[] = $val;
                }
            }
            $sql = "INSERT IGNORE INTO {$def['mysql']} ({$colStr}) VALUES " . implode(',', $valuesArr);
            try {
                $ins = $mysql->prepare($sql);
                $ins->execute($params);
            } catch (PDOException $e) {
                $errors[] = substr($e->getMessage(), 0, 200);
                if (count($errors) > 5) break;
            }
        }
        $mysql->exec("COMMIT");
    }

    $newOffset = $offset + $rowCount;
    $progress = $totalRows > 0 ? min(100, round(($newOffset / $totalRows) * 100, 1)) : 100;
    $done = $rowCount < BATCH_SIZE;
?>
    <div class="card">
        <h2><?= $def['mysql'] ?></h2>
        <p class="meta"><?= number_format($newOffset) ?> / <?= number_format($totalRows) ?> satır</p>

        <div class="progress">
            <div class="progress-bar" style="width: <?= $progress ?>%"><?= $progress ?>%</div>
        </div>

        <div class="ok">Bu oturumda <?= number_format($rowCount) ?> satır aktarıldı</div>

        <?php if (!empty($errors)): ?>
            <div class="err"><?= count($errors) ?> hata: <?= htmlspecialchars(implode('; ', $errors)) ?></div>
        <?php endif; ?>

        <?php if ($done): ?>
            <div class="ok"><strong>✓ TAMAMLANDI!</strong></div>
            <a href="?token=<?= SECURITY_TOKEN ?>" class="btn">Tablolara Dön</a>
        <?php else: ?>
            <div class="info">Devam ediliyor... Sayfa otomatik yenilenecek.</div>
            <script>
                setTimeout(function() {
                    window.location.href = '?token=<?= SECURITY_TOKEN ?>&action=migrate&table=<?= $table ?>&offset=<?= $newOffset ?>';
                }, 200);
            </script>
            <noscript>
                <a href="?token=<?= SECURITY_TOKEN ?>&action=migrate&table=<?= $table ?>&offset=<?= $newOffset ?>" class="btn">Devam Et</a>
            </noscript>
        <?php endif; ?>
    </div>

<?php else: ?>
    <div class="err">Geçersiz tablo: <?= htmlspecialchars($table) ?></div>
    <a href="?token=<?= SECURITY_TOKEN ?>" class="btn">Geri Dön</a>
<?php endif; ?>

</body></html>
