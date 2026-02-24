<?php
/**
 * Vehicle Specs SQL Importer
 *
 * Bu dosyayı Natro'ya yükleyin ve tarayıcıdan çalıştırın:
 * https://parcabizden.com.tr/data/import_specs.php
 *
 * Sırayla tüm part dosyalarını otomatik çalıştırır.
 * İşlem bitince bu dosyayı silin!
 */

set_time_limit(600); // 10 dakika
ini_set('memory_limit', '256M');

$DB_HOST = 'localhost';
$DB_NAME = 'u2547422_parcabizden';
$DB_USER = 'u2547422_uorta';
$DB_PASS = 'iR?]gvlh+l[AB_r2';

header('Content-Type: text/html; charset=utf-8');
echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Specs Import</title></head><body>";
echo "<h2>Vehicle Specs Import</h2><pre>";

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => true,
    ]);
    echo "✓ DB bağlantısı başarılı\n";

    // 1. Setup SQL (CREATE TABLE + ALTER TABLE)
    $setupFile = __DIR__ . '/autodata_setup.sql';
    if (file_exists($setupFile)) {
        $setupSql = file_get_contents($setupFile);
        $statements = array_filter(array_map('trim', explode(';', $setupSql)));
        foreach ($statements as $stmt) {
            if (empty($stmt) || strpos($stmt, '--') === 0) continue;
            try {
                $pdo->exec($stmt);
            } catch (PDOException $e) {
                // ALTER TABLE hata verebilir (kolon zaten varsa) — devam et
                if (strpos($e->getMessage(), 'Duplicate column') !== false) {
                    echo "⚠ spec_id kolonu zaten mevcut, devam ediliyor\n";
                } else if (strpos($e->getMessage(), 'already exists') !== false) {
                    echo "⚠ Tablo zaten mevcut, devam ediliyor\n";
                } else {
                    echo "⚠ Setup uyarı: " . $e->getMessage() . "\n";
                }
            }
        }
        echo "✓ Setup SQL çalıştırıldı\n";
    }

    // 2. Mevcut kayıt sayısını kontrol et
    try {
        $count = $pdo->query("SELECT COUNT(*) FROM vehicle_specs")->fetchColumn();
        echo "ℹ Mevcut kayıt: $count\n";
        if ($count > 0) {
            echo "⚠ Tablo dolu! Veri tekrarını önlemek için önce TRUNCATE yapılıyor...\n";
            $pdo->exec("TRUNCATE TABLE vehicle_specs");
            echo "✓ Tablo temizlendi\n";
        }
    } catch (PDOException $e) {
        echo "ℹ Tablo yeni oluşturuldu\n";
    }

    // 3. Part dosyalarını sırayla çalıştır
    $partFiles = glob(__DIR__ . '/vehicle_specs_part_*.sql');
    sort($partFiles);

    if (empty($partFiles)) {
        echo "✗ Part dosyaları bulunamadı! vehicle_specs_part_*.sql dosyalarını /data/ klasörüne yükleyin.\n";
    } else {
        echo "\n" . count($partFiles) . " part dosyası bulundu:\n\n";
        $totalInserted = 0;

        foreach ($partFiles as $file) {
            $basename = basename($file);
            $sql = file_get_contents($file);

            // SET ve boş satırları çıkar, sadece INSERT'leri çalıştır
            $lines = explode("\n", $sql);
            $insertBuffer = '';
            $batchCount = 0;

            foreach ($lines as $line) {
                $trimmed = trim($line);
                if (empty($trimmed) || strpos($trimmed, '--') === 0 || strpos($trimmed, 'SET ') === 0) continue;

                $insertBuffer .= $line . "\n";

                // INSERT kapandıysa çalıştır
                if (substr($trimmed, -1) === ';') {
                    if (strpos($insertBuffer, 'INSERT INTO') !== false) {
                        try {
                            $affected = $pdo->exec($insertBuffer);
                            $totalInserted += $affected;
                            $batchCount++;
                        } catch (PDOException $e) {
                            echo "✗ Hata ($basename batch $batchCount): " . substr($e->getMessage(), 0, 200) . "\n";
                        }
                    }
                    $insertBuffer = '';
                }
            }

            echo "✓ $basename — $batchCount batch işlendi\n";
            flush();
        }

        echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        $finalCount = $pdo->query("SELECT COUNT(*) FROM vehicle_specs")->fetchColumn();
        echo "✓ Toplam kayıt: $finalCount\n";

        // İstatistikler
        $brandCount = $pdo->query("SELECT COUNT(DISTINCT brand) FROM vehicle_specs")->fetchColumn();
        $modelCount = $pdo->query("SELECT COUNT(DISTINCT model) FROM vehicle_specs")->fetchColumn();
        echo "✓ $brandCount marka, $modelCount model\n";
    }

    echo "\n✅ İşlem tamamlandı!\n";
    echo "⚠ GÜVENLİK: Bu dosyayı ve part dosyalarını Natro'dan silin!\n";

} catch (PDOException $e) {
    echo "✗ DB Hatası: " . $e->getMessage() . "\n";
}

echo "</pre></body></html>";
