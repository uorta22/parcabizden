<?php
/**
 * OPcache Reset Utility — deploy sonrası bytecode cache'ini temizler.
 *
 * Kullanım:
 *   https://api.parcabizden.com.tr/opcache-reset.php?token=<JWT_SECRET ilk 16 karakter>
 *
 * Bu dosya bağımsız çalışır (router'a bağlı değil).
 *
 * GÜVENLİK NOTU — önceki sürümde şunlar vardı, kaldırıldı:
 *   - Kod içine gömülü sabit token ('parcabizden-reset'). Repoda ve git
 *     geçmişinde açık yazılıydı; herkes çalıştırabiliyordu.
 *   - 403 yanıtı kabul edilen token'ı, JWT_SECRET'ın uzunluğunu ve ilk 3
 *     karakterini ekrana basıyordu. Yani kilidi açan bilgiyi kapıya yazıyordu.
 *   - Yanıt, kullanılacak URL'i tam olarak söylüyordu.
 * Artık yetkisiz istek gövdesiz 403 döner, hiçbir şey sızdırmaz.
 *
 * İşin bittiğinde bu dosyayı sunucudan silmek hâlâ en temizi.
 */

// ── Token: yalnızca .env'deki JWT_SECRET'tan türetilir ──
$envFile = __DIR__ . '/.env';
$jwtSecret = '';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        [$k, $v] = explode('=', $line, 2);
        if (trim($k) === 'JWT_SECRET') {
            $jwtSecret = trim(trim($v), '"\'');
            break;
        }
    }
}

$expected = $jwtSecret !== '' ? substr($jwtSecret, 0, 16) : '';
$provided = (string)($_GET['token'] ?? '');

// JWT_SECRET okunamıyorsa araç tamamen kapalıdır — açık kapı bırakılmaz.
if ($expected === '' || !hash_equals($expected, $provided)) {
    http_response_code(403);
    exit;
}

header('Content-Type: text/plain; charset=utf-8');

echo "=== OPcache Reset ===\n";

if (function_exists('opcache_reset')) {
    echo opcache_reset() ? "✓ opcache_reset() başarılı\n" : "✗ opcache_reset() başarısız\n";
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
