<?php
/**
 * security.php — Güvenlik fonksiyonları
 * Rate limiting, IP kara liste, başarısız giriş takibi, admin audit log
 *
 * Bağımlılık: jsonResponse() (natro-index.php'de tanımlı)
 */

// ==================== Rate Limiting ====================

function get_client_ip(): string {
    // Cloudflare arkasında: CF-Connecting-IP en güvenilir kaynak
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        return trim($_SERVER['HTTP_CF_CONNECTING_IP']);
    }
    // Doğrudan bağlantı: REMOTE_ADDR kullan (X-Forwarded-For client tarafından manipüle edilebilir)
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/**
 * Sayaclarin tutuldugu dizin.
 *
 * Onceden sys_get_temp_dir() kullaniliyordu; paylasimli hostingde bu dizin
 * istekler arasinda paylasilmadigi icin sayac her seferinde bos okunuyor ve
 * hicbir limit devreye girmiyordu (canli ortamda 4 ardisik istekle dogrulandi).
 * Deploy zaten uygulama altinda korumali bir tmp/rate_limits olusturuyor
 * (bkz. .github/workflows/deploy-php.yml) — dogru yer orasi.
 */
function rate_limit_dir(): string {
    return __DIR__ . '/tmp/rate_limits';
}

function check_rate_limit($action, $max_attempts = 5, $window_minutes = 15) {
    $ip = get_client_ip();
    $dir = rate_limit_dir();
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        // Sayac tutulamiyorsa istegi engellemiyoruz ama sessiz kalmiyoruz:
        // limitin kapali oldugu fark edilmeden gecmemeli.
        error_log('Rate limit dizini olusturulamadi: ' . $dir);
        return true;
    }
    $file = $dir . '/' . md5($action . '_' . $ip) . '.json';

    $now = time();
    $attempts = [];
    if (file_exists($file)) {
        $data = json_decode((string)file_get_contents($file), true);
        if (is_array($data)) $attempts = array_filter($data, fn($t) => ($now - $t) < ($window_minutes * 60));
    }

    if (count($attempts) >= $max_attempts) {
        http_response_code(429);
        echo json_encode(['error' => 'Cok fazla deneme. Lutfen ' . $window_minutes . ' dakika bekleyin.']);
        return false;
    }

    $attempts[] = $now;
    if (@file_put_contents($file, json_encode(array_values($attempts)), LOCK_EX) === false) {
        error_log('Rate limit sayaci yazilamadi: ' . $file);
    }
    return true;
}

// ==================== IP Kara Liste Sistemi ====================

function check_ip_blacklist($pdo): bool {
    $ip = get_client_ip();
    try {
        $stmt = $pdo->prepare('SELECT id FROM ip_blacklist WHERE ip = :ip AND expires_at > NOW()');
        $stmt->execute([':ip' => $ip]);
        if ($stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Erisim engellendi. Lutfen daha sonra tekrar deneyin.']);
            return false;
        }
    } catch (PDOException $e) {
        // Tablo yoksa sessizce devam et
        error_log('IP blacklist check error: ' . $e->getMessage());
    }
    return true;
}

function ban_ip($pdo, string $ip, string $reason, int $duration_minutes = 30): void {
    try {
        $stmt = $pdo->prepare('INSERT INTO ip_blacklist (ip, reason, expires_at) VALUES (:ip, :reason, DATE_ADD(NOW(), INTERVAL :minutes MINUTE))');
        $stmt->execute([':ip' => $ip, ':reason' => $reason, ':minutes' => $duration_minutes]);
    } catch (PDOException $e) {
        error_log('IP ban error: ' . $e->getMessage());
    }
}

// ==================== Basarisiz Giris Takibi ====================

function record_failed_login(string $ip, string $email): void {
    $dir = sys_get_temp_dir() . '/parcabizden_failed_logins';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);

    // Loglama
    $logFile = $dir . '/failed_logins.log';
    $logLine = date('Y-m-d H:i:s') . " | IP: $ip | Email: $email\n";
    @file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);

    // IP bazli ardisik basarisiz deneme sayaci
    $counterFile = $dir . '/' . md5('consecutive_' . $ip) . '.json';
    $data = ['count' => 0, 'last_attempt' => 0];
    if (file_exists($counterFile)) {
        $existing = json_decode(file_get_contents($counterFile), true);
        if (is_array($existing)) $data = $existing;
    }
    // 30 dk'dan eski kayitlari sifirla
    if (time() - ($data['last_attempt'] ?? 0) > 1800) {
        $data['count'] = 0;
    }
    $data['count']++;
    $data['last_attempt'] = time();
    @file_put_contents($counterFile, json_encode($data));
}

function get_failed_login_count(string $ip): int {
    $dir = sys_get_temp_dir() . '/parcabizden_failed_logins';
    $counterFile = $dir . '/' . md5('consecutive_' . $ip) . '.json';
    if (!file_exists($counterFile)) return 0;
    $data = json_decode(file_get_contents($counterFile), true);
    if (!is_array($data)) return 0;
    // 30 dk'dan eski kayitlari sifirla
    if (time() - ($data['last_attempt'] ?? 0) > 1800) return 0;
    return (int)($data['count'] ?? 0);
}

function clear_failed_logins(string $ip): void {
    $dir = sys_get_temp_dir() . '/parcabizden_failed_logins';
    $counterFile = $dir . '/' . md5('consecutive_' . $ip) . '.json';
    if (file_exists($counterFile)) @unlink($counterFile);
}

// ==================== Admin Audit Log ====================

function admin_audit_log($pdo, int $userId, string $action, ?int $targetId = null, ?string $details = null): void {
    $ip = get_client_ip();
    try {
        $stmt = $pdo->prepare('INSERT INTO admin_audit_log (user_id, action, target_id, details, ip) VALUES (:uid, :action, :tid, :details, :ip)');
        $stmt->execute([':uid' => $userId, ':action' => $action, ':tid' => $targetId, ':details' => $details, ':ip' => $ip]);
    } catch (PDOException $e) {
        error_log('Audit log error: ' . $e->getMessage());
    }
}
