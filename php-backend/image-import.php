<?php
/**
 * image-import.php — TecDoc parça görseli batch import
 *
 * Windows makinedeki Python script bu endpoint'e batch halinde
 * görsel dosyaları + metadata gönderir.
 *
 * Endpoints:
 *   action=upload_batch   → Görsel dosyalarını yükle + DB'ye kaydet
 *   action=import_status  → İlerleme durumunu göster
 *   action=migrate_csv    → article_images.csv verisini DB'ye aktar (dosyasız)
 *
 * Güvenlik: SECRET_KEY ile korunur
 */

// ─── Konfigürasyon ───────────────────────────────────────────────
define('SECRET_KEY', 'parcabizden_img_2024_secret'); // Python script'te de aynı olmalı
define('UPLOAD_DIR', __DIR__ . '/uploads/parts/');  // Görsellerin kaydedileceği dizin (FTP erişilebilir)
define('MAX_BATCH_SIZE', 50);  // Tek seferde max dosya sayısı
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB per file

header('Content-Type: application/json; charset=utf-8');

// ─── DB Bağlantısı ──────────────────────────────────────────────
$config = [];
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos($line, '#') === 0) continue;
        list($key, $val) = array_pad(explode('=', $line, 2), 2, '');
        $config[trim($key)] = trim($val, '"\'');
    }
}

try {
    $pdo = new PDO(
        "mysql:host={$config['DB_HOST']};dbname={$config['DB_NAME']};charset=utf8mb4",
        $config['DB_USER'],
        $config['DB_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    echo json_encode(['error' => 'DB bağlantı hatası']);
    exit;
}

// ─── Güvenlik kontrolü ──────────────────────────────────────────
$key = $_POST['secret'] ?? $_GET['secret'] ?? '';
if ($key !== SECRET_KEY) {
    http_response_code(403);
    echo json_encode(['error' => 'Yetkisiz erişim']);
    exit;
}

// ─── Migration: part_images tablosu oluştur ─────────────────────
$pdo->exec("
    CREATE TABLE IF NOT EXISTS part_images (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        supplier_id     INT,
        part_number     VARCHAR(100),
        picture_name    VARCHAR(255),
        file_path       VARCHAR(500) DEFAULT NULL,
        doc_type        VARCHAR(50) DEFAULT 'Picture',
        uploaded        TINYINT(1) DEFAULT 0,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_img (supplier_id, part_number, picture_name),
        INDEX idx_picture (picture_name),
        INDEX idx_part (part_number),
        INDEX idx_uploaded (uploaded)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// ─── ACTION: upload_batch ───────────────────────────────────────
// Görsel dosyalarını al, diske kaydet, DB'yi güncelle
if ($action === 'upload_batch') {
    $folder = $_POST['folder'] ?? '';   // Kaynak klasör numarası (1-4999)

    if (empty($_FILES['images'])) {
        echo json_encode(['error' => 'Dosya bulunamadı']);
        exit;
    }

    // Hedef klasörü oluştur
    $targetDir = UPLOAD_DIR . $folder . '/';
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    $uploaded = 0;
    $skipped = 0;
    $errors = [];
    $dbUpdated = 0;

    $files = $_FILES['images'];
    $count = is_array($files['name']) ? count($files['name']) : 1;

    // Metadata (JSON olarak gönderilir)
    $metadata = json_decode($_POST['metadata'] ?? '[]', true) ?: [];

    $stmt = $pdo->prepare("
        INSERT INTO part_images (supplier_id, part_number, picture_name, file_path, doc_type, uploaded)
        VALUES (:sid, :pn, :pic, :fp, :dt, 1)
        ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), uploaded = 1
    ");

    for ($i = 0; $i < $count; $i++) {
        $name = is_array($files['name']) ? $files['name'][$i] : $files['name'];
        $tmp = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $size = is_array($files['size']) ? $files['size'][$i] : $files['size'];
        $err = is_array($files['error']) ? $files['error'][$i] : $files['error'];

        if ($err !== UPLOAD_ERR_OK) {
            $errors[] = "$name: upload error $err";
            continue;
        }

        if ($size > MAX_FILE_SIZE) {
            $errors[] = "$name: dosya çok büyük ($size bytes)";
            continue;
        }

        $targetPath = $targetDir . $name;

        // Zaten varsa atla
        if (file_exists($targetPath)) {
            $skipped++;
            continue;
        }

        if (move_uploaded_file($tmp, $targetPath)) {
            $uploaded++;

            // DB güncelle (metadata varsa)
            $meta = $metadata[$i] ?? null;
            if ($meta) {
                $relativePath = "parts/$folder/$name";
                $stmt->execute([
                    ':sid' => $meta['supplier_id'] ?? 0,
                    ':pn'  => $meta['part_number'] ?? '',
                    ':pic' => $name,
                    ':fp'  => $relativePath,
                    ':dt'  => $meta['doc_type'] ?? 'Picture',
                ]);
                $dbUpdated++;
            }
        } else {
            $errors[] = "$name: taşıma hatası";
        }
    }

    echo json_encode([
        'status' => 'ok',
        'folder' => $folder,
        'uploaded' => $uploaded,
        'skipped' => $skipped,
        'db_updated' => $dbUpdated,
        'errors' => $errors,
    ]);
    exit;
}

// ─── ACTION: migrate_csv ────────────────────────────────────────
// article_images.csv metadata'sını DB'ye aktar (dosya yüklemeden)
// Bu adım opsiyonel — eğer CSV sunucudaysa kullanılır
if ($action === 'migrate_csv') {
    $batchData = json_decode(file_get_contents('php://input'), true);
    if (!$batchData || !is_array($batchData)) {
        echo json_encode(['error' => 'JSON body gerekli']);
        exit;
    }

    $inserted = 0;
    $skipped = 0;

    $stmt = $pdo->prepare("
        INSERT IGNORE INTO part_images (supplier_id, part_number, picture_name, doc_type)
        VALUES (:sid, :pn, :pic, :dt)
    ");

    $pdo->beginTransaction();
    foreach ($batchData as $row) {
        try {
            $stmt->execute([
                ':sid' => $row['supplier_id'] ?? 0,
                ':pn'  => $row['part_number'] ?? '',
                ':pic' => $row['picture_name'] ?? '',
                ':dt'  => $row['doc_type'] ?? 'Picture',
            ]);
            if ($stmt->rowCount() > 0) $inserted++;
            else $skipped++;
        } catch (PDOException $e) {
            $skipped++;
        }
    }
    $pdo->commit();

    echo json_encode([
        'status' => 'ok',
        'inserted' => $inserted,
        'skipped' => $skipped,
        'batch_size' => count($batchData),
    ]);
    exit;
}

// ─── ACTION: import_status ──────────────────────────────────────
if ($action === 'import_status') {
    $total = $pdo->query("SELECT COUNT(*) FROM part_images")->fetchColumn();
    $uploaded = $pdo->query("SELECT COUNT(*) FROM part_images WHERE uploaded = 1")->fetchColumn();
    $pending = $total - $uploaded;

    // Disk kullanımı
    $diskUsage = '0B';
    try {
        if (is_dir(UPLOAD_DIR)) {
            $bytes = 0;
            $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(UPLOAD_DIR, FilesystemIterator::SKIP_DOTS));
            foreach ($it as $file) {
                if ($file->isFile()) $bytes += $file->getSize();
            }
            if ($bytes >= 1073741824) $diskUsage = round($bytes / 1073741824, 1) . 'G';
            elseif ($bytes >= 1048576) $diskUsage = round($bytes / 1048576, 1) . 'M';
            elseif ($bytes >= 1024) $diskUsage = round($bytes / 1024, 1) . 'K';
            else $diskUsage = $bytes . 'B';
        }
    } catch (Exception $e) {
        $diskUsage = 'N/A';
    }

    echo json_encode([
        'total_records' => (int)$total,
        'uploaded_files' => (int)$uploaded,
        'pending' => (int)$pending,
        'disk_usage' => $diskUsage,
        'upload_dir' => UPLOAD_DIR,
    ]);
    exit;
}

// ─── ACTION: link_to_parts ──────────────────────────────────────
// part_images tablosundaki görselleri parts tablosuna bağla
// 3 aşamalı eşleştirme: direkt OEM → cross_ref → supplier part_number
if ($action === 'link_to_parts') {
    $stats = ['direct' => 0, 'cross_ref' => 0, 'total' => 0];

    // Aşama 1: Direkt eşleşme — part_images.part_number = products.oem_number
    $direct = $pdo->exec("
        UPDATE products p
        INNER JOIN part_images pi ON pi.part_number = p.oem_number AND pi.uploaded = 1
        SET p.thumbnail = CONCAT('/uploads/', pi.file_path)
        WHERE p.thumbnail IS NULL OR p.thumbnail = ''
    ");
    $stats['direct'] = (int)$direct;

    // Aşama 2: cross_ref üzerinden eşleşme
    // cross_ref tablosunda supplier_part_number → oem_number eşleşmeleri var
    try {
        $crossRef = $pdo->exec("
            UPDATE products p
            INNER JOIN catalog_cross_ref cr ON cr.oem_number = p.oem_number
            INNER JOIN part_images pi ON pi.part_number = cr.supplier_part_number AND pi.uploaded = 1
            SET p.thumbnail = CONCAT('/uploads/', pi.file_path)
            WHERE p.thumbnail IS NULL OR p.thumbnail = ''
        ");
        $stats['cross_ref'] = (int)$crossRef;
    } catch (PDOException $e) {
        // catalog_cross_ref tablosu yoksa atla
        $stats['cross_ref_error'] = $e->getMessage();
    }

    $stats['total'] = $stats['direct'] + $stats['cross_ref'];

    echo json_encode([
        'status' => 'ok',
        'products_updated' => $stats['total'],
        'details' => $stats,
    ]);
    exit;
}

// ─── ACTION: scan_directory ─────────────────────────────────────
// FTP ile yüklenen dosyaları tarayıp part_images tablosuna kaydet
if ($action === 'scan_directory') {
    if (!is_dir(UPLOAD_DIR)) {
        echo json_encode(['error' => 'Upload dizini bulunamadı: ' . UPLOAD_DIR]);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT IGNORE INTO part_images (supplier_id, part_number, picture_name, file_path, uploaded)
        VALUES (0, '', :pic, :fp, 1)
    ");

    $scanned = 0;
    $inserted = 0;
    $startTime = microtime(true);

    // uploads/parts/ altındaki klasörleri tara
    $folders = glob(UPLOAD_DIR . '*', GLOB_ONLYDIR);
    $totalFolders = count($folders);

    $pdo->beginTransaction();

    foreach ($folders as $folder) {
        $folderName = basename($folder);
        $files = glob($folder . '/*.{jpg,jpeg,png,gif,bmp,webp,tif,tiff}', GLOB_BRACE);

        foreach ($files as $file) {
            $fileName = basename($file);
            $relativePath = "parts/$folderName/$fileName";

            $stmt->execute([
                ':pic' => $fileName,
                ':fp'  => $relativePath,
            ]);

            if ($stmt->rowCount() > 0) $inserted++;
            $scanned++;

            // Her 10K kayıtta commit
            if ($scanned % 10000 === 0) {
                $pdo->commit();
                $pdo->beginTransaction();
            }
        }
    }

    $pdo->commit();
    $elapsed = round(microtime(true) - $startTime, 1);

    echo json_encode([
        'status' => 'ok',
        'folders_scanned' => $totalFolders,
        'files_scanned' => $scanned,
        'new_records' => $inserted,
        'elapsed_seconds' => $elapsed,
    ]);
    exit;
}

echo json_encode(['error' => 'Geçersiz action. Kullanım: upload_batch, migrate_csv, import_status, link_to_parts, scan_directory']);
