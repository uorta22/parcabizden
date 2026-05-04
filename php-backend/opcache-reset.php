<?php
/**
 * OPcache Reset Utility — token korumalı tek seferlik araç
 *
 * Kullanım:
 *   https://api.parcabizden.com.tr/opcache-reset.php?token=<JWT_SECRET değerinin ilk 16 karakteri>
 *
 * Bu dosya bağımsız çalışır (router'a bağlı değil), bu yüzden
 * router cache'lenmiş olsa bile çağrılabilir. OPcache temizlenince
 * bir sonraki istekte yeni router yüklenir.
 *
 * GÜVENLİK: Token zorunlu. Yanlış token → 403.
 * Bu dosyayı silmek için workflow'tan exclude et veya manual sil.
 */

header('Content-Type: text/plain; charset=utf-8');

// .env'den JWT_SECRET'i oku (token doğrulama için)
$envFile = __DIR__ . '/.env';
$secret = '';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        [$k, $v] = explode('=', $line, 2);
        if (trim($k) === 'JWT_SECRET') { $secret = trim($v); break; }
    }
}

if (!$secret) {
    http_response_code(500);
    echo "JWT_SECRET .env'de bulunamadı\n";
    exit;
}

$expectedToken = substr($secret, 0, 16);
$providedToken = $_GET['token'] ?? '';

if (!hash_equals($expectedToken, $providedToken)) {
    http_response_code(403);
    echo "Yetkisiz erişim. ?token=<JWT_SECRET'in ilk 16 karakteri>\n";
    exit;
}

echo "=== OPcache Reset ===\n";

if (function_exists('opcache_reset')) {
    $result = opcache_reset();
    echo $result ? "✓ opcache_reset() başarılı\n" : "✗ opcache_reset() başarısız\n";
} else {
    echo "✗ opcache_reset fonksiyonu mevcut değil\n";
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

echo "\n=== Yapılması Gereken ===\n";
echo "1. Bu dosyayı sil (FTP veya cPanel ile) — tek seferlik araç.\n";
echo "2. https://api.parcabizden.com.tr/?action=tecdoc_brands ile test et.\n";
