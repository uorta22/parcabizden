<?php
/**
 * BigDump — Büyük SQL dosyalarını parçalayarak MySQL'e import eden araç
 * ParcaBizden katalog veritabanı migration'ı için özelleştirilmiş versiyon
 *
 * Kullanım:
 * 1. SQL dosyalarını FTP ile sunucuya yükleyin (sql_import/ klasörüne)
 * 2. Tarayıcıdan https://api.parcabizden.com.tr/bigdump.php adresini açın
 * 3. Import edilecek dosyayı seçin ve başlatın
 *
 * GÜVENLİK: Import bitince bu dosyayı sunucudan SİLİN!
 */

// Güvenlik token — URL'de ?token=... olarak gönderilmeli
define('SECURITY_TOKEN', 'pBzD_import_2026_xK9');

// .env'den DB bilgilerini oku
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

$db_host = $env['DB_HOST'] ?? 'localhost';
$db_name = $env['DB_NAME'] ?? '';
$db_user = $env['DB_USER'] ?? '';
$db_pass = $env['DB_PASS'] ?? '';

// Import ayarları
$sqlDir = __DIR__ . '/sql_import';        // SQL dosyalarının bulunduğu dizin
$linesPerSession = 3000;                   // Her oturumda çalıştırılacak satır sayısı
$delayPerSession = 0;                      // Oturumlar arası bekleme (saniye)

// ==================== Güvenlik Kontrolü ====================
$token = $_GET['token'] ?? '';
if ($token !== SECURITY_TOKEN) {
    http_response_code(403);
    echo '<!DOCTYPE html><html><body><h1>Erişim Engellendi</h1><p>Geçerli token gerekli: ?token=TOKEN</p></body></html>';
    exit;
}

// ==================== Fonksiyonlar ====================

function connectDB(): PDO {
    global $db_host, $db_name, $db_user, $db_pass;
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => true,
            PDO::MYSQL_ATTR_LOCAL_INFILE => true,
        ]
    );
    $pdo->exec("SET NAMES utf8mb4");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("SET UNIQUE_CHECKS = 0");
    $pdo->exec("SET AUTOCOMMIT = 0");
    return $pdo;
}

function getSqlFiles(): array {
    global $sqlDir;
    if (!is_dir($sqlDir)) {
        mkdir($sqlDir, 0755, true);
        return [];
    }
    $files = glob($sqlDir . '/*.sql');
    sort($files);
    return array_map('basename', $files);
}

function formatBytes(int $bytes): string {
    if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' MB';
    if ($bytes >= 1024) return round($bytes / 1024, 1) . ' KB';
    return $bytes . ' B';
}

// ==================== İşlem ====================

$action = $_GET['action'] ?? 'list';
$file = $_GET['file'] ?? '';
$offset = (int)($_GET['offset'] ?? 0);

// XSS koruması
$file = basename($file);

?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ParcaBizden — SQL Import</title>
    <style>
        body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; background: #f5f5f5; }
        h1 { color: #1a1a1a; }
        .card { background: white; border-radius: 8px; padding: 20px; margin: 16px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .file-list { list-style: none; padding: 0; }
        .file-list li { padding: 12px 16px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .file-list li:last-child { border-bottom: none; }
        .btn { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #1d4ed8; }
        .btn-danger { background: #dc2626; }
        .btn-danger:hover { background: #b91c1c; }
        .progress { background: #e5e7eb; border-radius: 999px; height: 24px; overflow: hidden; margin: 16px 0; }
        .progress-bar { background: #2563eb; height: 100%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; min-width: 40px; }
        .status { padding: 12px; border-radius: 6px; margin: 12px 0; }
        .status-ok { background: #d1fae5; color: #065f46; }
        .status-error { background: #fee2e2; color: #991b1b; }
        .status-info { background: #dbeafe; color: #1e40af; }
        pre { background: #1a1a1a; color: #22c55e; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; max-height: 300px; overflow-y: auto; }
        .meta { color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>

<h1>ParcaBizden SQL Import</h1>

<?php if ($action === 'list'): ?>
    <div class="card">
        <h2>SQL Dosyaları</h2>
        <p class="meta">Dizin: <?= htmlspecialchars($sqlDir) ?></p>
        <?php
        $files = getSqlFiles();
        if (empty($files)):
        ?>
            <div class="status status-info">
                Henüz SQL dosyası yok. FTP ile <code>sql_import/</code> dizinine yükleyin.
            </div>
        <?php else: ?>
            <ul class="file-list">
            <?php foreach ($files as $f):
                $fpath = $sqlDir . '/' . $f;
                $size = formatBytes(filesize($fpath));
            ?>
                <li>
                    <span><strong><?= htmlspecialchars($f) ?></strong> <span class="meta">(<?= $size ?>)</span></span>
                    <a href="?token=<?= SECURITY_TOKEN ?>&action=import&file=<?= urlencode($f) ?>&offset=0" class="btn">Import Et</a>
                </li>
            <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </div>

    <div class="card">
        <h2>Veritabanı Durumu</h2>
        <?php
        try {
            $pdo = connectDB();
            $tables = $pdo->query("SHOW TABLES LIKE 'catalog_%'")->fetchAll(PDO::FETCH_COLUMN);
            if (empty($tables)) {
                echo '<div class="status status-info">Henüz catalog_* tablosu yok. Önce <code>catalog_schema.sql</code> dosyasını çalıştırın.</div>';
            } else {
                echo '<ul class="file-list">';
                foreach ($tables as $t) {
                    $count = $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
                    echo "<li><strong>$t</strong> <span class='meta'>" . number_format($count) . " satır</span></li>";
                }
                echo '</ul>';
            }
        } catch (PDOException $e) {
            echo '<div class="status status-error">DB bağlantı hatası: ' . htmlspecialchars($e->getMessage()) . '</div>';
        }
        ?>
    </div>

<?php elseif ($action === 'import' && $file): ?>
    <?php
    $filePath = $sqlDir . '/' . $file;
    if (!file_exists($filePath)) {
        echo '<div class="status status-error">Dosya bulunamadı: ' . htmlspecialchars($file) . '</div>';
        echo '<a href="?token=' . SECURITY_TOKEN . '" class="btn">Geri Dön</a>';
        exit;
    }

    $fileSize = filesize($filePath);
    $handle = fopen($filePath, 'r');
    fseek($handle, $offset);

    $pdo = connectDB();
    $linesExecuted = 0;
    $errors = [];
    $query = '';
    $bytesRead = $offset;

    while ($linesExecuted < $linesPerSession && !feof($handle)) {
        $line = fgets($handle);
        if ($line === false) break;

        $bytesRead = ftell($handle);
        $trimmed = trim($line);

        // Boş satır ve yorum atla
        if ($trimmed === '' || strpos($trimmed, '--') === 0 || strpos($trimmed, '/*') === 0) continue;

        // SET komutları direkt çalıştır
        if (preg_match('/^SET\s/i', $trimmed)) {
            try {
                $pdo->exec($trimmed);
            } catch (PDOException $e) {
                // SET komutları hata verirse devam et
            }
            continue;
        }

        $query .= $line;

        // Sorgu tamamlandı mı? (noktalı virgülle bitiyor)
        if (substr($trimmed, -1) === ';') {
            try {
                $pdo->exec($query);
                $linesExecuted++;
            } catch (PDOException $e) {
                $errors[] = "Satır ~$bytesRead: " . substr($e->getMessage(), 0, 200);
                if (count($errors) > 10) break; // Çok fazla hata varsa dur
            }
            $query = '';
        }
    }

    $pdo->exec("COMMIT");
    fclose($handle);

    $done = feof(fopen($filePath, 'r')) || $bytesRead >= $fileSize;
    if ($bytesRead >= $fileSize) $done = true;
    $progress = $fileSize > 0 ? min(100, round(($bytesRead / $fileSize) * 100, 1)) : 100;
    ?>

    <div class="card">
        <h2>Import: <?= htmlspecialchars($file) ?></h2>
        <p class="meta">Boyut: <?= formatBytes($fileSize) ?> | Offset: <?= formatBytes($bytesRead) ?> / <?= formatBytes($fileSize) ?></p>

        <div class="progress">
            <div class="progress-bar" style="width: <?= $progress ?>%"><?= $progress ?>%</div>
        </div>

        <div class="status status-ok">
            ✓ Bu oturumda <?= $linesExecuted ?> sorgu çalıştırıldı
        </div>

        <?php if (!empty($errors)): ?>
            <div class="status status-error">
                <strong><?= count($errors) ?> hata:</strong>
                <pre><?= htmlspecialchars(implode("\n", $errors)) ?></pre>
            </div>
        <?php endif; ?>

        <?php if ($done): ?>
            <div class="status status-ok">
                <strong>✓ İMPORT TAMAMLANDI!</strong> — <?= htmlspecialchars($file) ?>
            </div>
            <a href="?token=<?= SECURITY_TOKEN ?>" class="btn">Dosya Listesine Dön</a>
        <?php else: ?>
            <div class="status status-info">
                Devam ediliyor... Sayfa otomatik yenilenecek.
            </div>
            <script>
                setTimeout(function() {
                    window.location.href = '?token=<?= SECURITY_TOKEN ?>&action=import&file=<?= urlencode($file) ?>&offset=<?= $bytesRead ?>';
                }, <?= $delayPerSession * 1000 + 100 ?>);
            </script>
            <noscript>
                <a href="?token=<?= SECURITY_TOKEN ?>&action=import&file=<?= urlencode($file) ?>&offset=<?= $bytesRead ?>" class="btn">Devam Et</a>
            </noscript>
        <?php endif; ?>
    </div>

<?php endif; ?>

<div class="card" style="margin-top: 32px;">
    <p class="meta">
        <strong>Kullanım Talimatları:</strong><br>
        1. <code>catalog_schema.sql</code>'i phpMyAdmin'den çalıştır (tabloları oluşturur)<br>
        2. SQL export dosyalarını FTP ile <code>sql_import/</code> klasörüne yükle<br>
        3. Bu sayfadan sırasıyla import et: önce küçük tablolar, sonra büyükler<br>
        4. Import bitince bu dosyayı sunucudan SİL!
    </p>
</div>

</body>
</html>
