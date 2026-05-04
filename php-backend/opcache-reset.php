<?php
/**
 * OPcache Reset Utility — token korumalı tek seferlik araç
 * Version: 3 (sabit token + debug output)
 *
 * Kullanım (en kolay yol):
 *   https://api.parcabizden.com.tr/opcache-reset.php?token=parcabizden-reset
 *
 * Alternatif (JWT_SECRET ilk 16 karakter):
 *   https://api.parcabizden.com.tr/opcache-reset.php?token=<JWT_SECRET ilk 16>
 *
 * Bu dosya bağımsız çalışır (router'a bağlı değil).
 * GÜVENLİK: Tek seferlik araç; çalıştırdıktan sonra cPanel'den SİL.
 */

header('Content-Type: text/plain; charset=utf-8');

// ── Token doğrulama ──
const SIMPLE_TOKEN = 'parcabizden-reset';

$envFile = __DIR__ . '/.env';
$jwtSecret = '';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        [$k, $v] = explode('=', $line, 2);
        if (trim($k) === 'JWT_SECRET') {
            // Tırnak işaretlerini de soyma
            $jwtSecret = trim(trim($v), '"\'');
            break;
        }
    }
}

$jwtToken = $jwtSecret ? substr($jwtSecret, 0, 16) : '';
$providedToken = $_GET['token'] ?? '';

$tokenOk = hash_equals(SIMPLE_TOKEN, $providedToken)
        || ($jwtToken && hash_equals($jwtToken, $providedToken));

if (!$tokenOk) {
    http_response_code(403);
    echo "=== Yetkisiz erişim (403) ===\n\n";
    echo "Gönderdiğin token uzunluğu: " . strlen($providedToken) . "\n";
    if ($providedToken) {
        echo "Gönderdiğin token önizleme: " . substr($providedToken, 0, 3) . "...\n";
    }
    echo "\n";
    echo "Kabul edilen token'lar:\n";
    echo "  1) Sabit: parcabizden-reset\n";
    if ($jwtSecret) {
        echo "  2) JWT_SECRET ilk 16 karakter (uzunluk: " . strlen($jwtToken) . ", önizleme: " . substr($jwtToken, 0, 3) . "...)\n";
    } else {
        echo "  2) JWT_SECRET .env'de bulunamadı\n";
    }
    echo "\nKolay yol: tarayıcıda şu URL'i aç:\n";
    echo "https://api.parcabizden.com.tr/opcache-reset.php?token=parcabizden-reset\n";
    exit;
}

// ── OPcache reset ──
echo "=== OPcache Reset ===\n";

if (function_exists('opcache_reset')) {
    $result = opcache_reset();
    echo $result ? "✓ opcache_reset() başarılı\n" : "✗ opcache_reset() başarısız\n";
} else {
    echo "✗ opcache_reset fonksiyonu mevcut değil (PHP konfig)\n";
}

if (function_exists('opcache_get_status')) {
    $status = @opcache_get_status(false);
    if ($status) {
        echo "\n=== OPcache Durumu ===\n";
        echo "Aktif: " . ($status['opcache_enabled'] ? 'evet' : 'hayır') . "\n";
        echo "Cache hit oranı: " . number_format($status['opcache_statistics']['opcache_hit_rate'] ?? 0, 2) . "%\n";
        echo "Dolu memory: " . number_format(($status['memory_usage']['used_memory'] ?? 0) / 1024 / 1024, 2) . " MB\n";
        echo "Cache'lenmiş dosya: " . ($status['opcache_statistics']['num_cached_scripts'] ?? 0) . "\n";
    }
}

echo "\n=== Çalıştığı Yer ===\n";
echo "Script yolu: " . __FILE__ . "\n";
echo "index.php var mı: " . (file_exists(__DIR__ . '/index.php') ? 'evet (' . filesize(__DIR__ . '/index.php') . ' bytes)' : 'HAYIR') . "\n";
echo "tecdoc.php var mı: " . (file_exists(__DIR__ . '/tecdoc.php') ? 'evet (' . filesize(__DIR__ . '/tecdoc.php') . ' bytes)' : 'HAYIR') . "\n";

echo "\n=== Sıradaki Adım ===\n";
echo "1. https://api.parcabizden.com.tr/?action=tecdoc_brands ile test et.\n";
echo "2. Çalışırsa bu dosyayı (opcache-reset.php) cPanel'den SİL.\n";
