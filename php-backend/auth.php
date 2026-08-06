<?php
/**
 * auth.php — JWT ve kullanıcı kimlik doğrulama fonksiyonları
 * base64url_encode, jwt_encode, jwt_decode, get_auth_user_id,
 * requireAdmin, handle_register, handle_login, handle_profile,
 * handle_verify_email, handle_resend_verify, handle_forgot_password,
 * handle_reset_password
 *
 * Bağımlılık: security.php (check_rate_limit, get_client_ip, ban_ip,
 *             record_failed_login, get_failed_login_count, clear_failed_logins)
 *             email.php (send_verification_email, send_reset_email)
 *             jsonResponse() (natro-index.php'de tanımlı)
 * Sabitler: JWT_SECRET, JWT_EXPIRY (natro-index.php'de define edilmiş)
 */

/** Sifre sifirlama tokeninin omru (sn). Throttle hesabi da bunu kullanir. */
if (!defined('RESET_TOKEN_TTL')) define('RESET_TOKEN_TTL', 3600);
/** E-posta dogrulama tokeninin omru (sn). */
if (!defined('VERIFY_TOKEN_TTL')) define('VERIFY_TOKEN_TTL', 86400);

/**
 * E-posta dogrulama ve sifre sifirlama tokenlari ayni `verify_token` sutununu
 * paylasiyor. Tip onegi olmadan, sizan bir dogrulama linki sifre sifirlama
 * linkine cevrilip hesap ele gecirilebiliyordu.
 *
 * Onek 2 karakter, rastgele kisim 62 karakter (31 bayt = 248 bit) — toplam 64,
 * yani sutun genisligi ne olursa olsun tasma riski yok.
 */
const TOKEN_TYPE_VERIFY = 'v_';
const TOKEN_TYPE_RESET  = 'r_';

function make_token(string $type): string {
    return $type . bin2hex(random_bytes(31));
}

function token_has_type(string $token, string $type): bool {
    return strncmp($token, $type, strlen($type)) === 0;
}

// ==================== JWT Functions ====================

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function jwt_encode($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;
    $segments = [base64url_encode($header), base64url_encode(json_encode($payload))];
    $signing_input = implode('.', $segments);
    $signature = hash_hmac('sha256', $signing_input, JWT_SECRET, true);
    $segments[] = base64url_encode($signature);
    return implode('.', $segments);
}

function jwt_decode($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    $signature = hash_hmac('sha256', $parts[0] . '.' . $parts[1], JWT_SECRET, true);
    if (!hash_equals(base64url_encode($signature), $parts[2])) return null;
    $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) return null;
    return $payload;
}

function get_auth_user_id() {
    $header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
    if (!$header || !preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) return null;
    $payload = jwt_decode($matches[1]);
    return $payload ? ($payload['user_id'] ?? null) : null;
}

// ==================== Admin Helpers ====================

/**
 * Kullanicinin admin yetkisini kontrol eder; yetkisiz ise 403 donup cikis yapar.
 */
function requireAdmin($db, $userId): void {
    $stmt = $db->prepare('SELECT is_admin FROM users WHERE id = :id AND deleted_at IS NULL');
    $stmt->execute([':id' => $userId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row || !$row['is_admin']) {
        jsonResponse(['error' => 'Yetkisiz erisim'], 403);
    }
}

// ==================== Auth Handlers ====================

function handle_register($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    if (!check_rate_limit('register', 5, 15)) return;

    try {
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $name = trim($_POST['name'] ?? '');
        $phone = trim($_POST['phone'] ?? '');

        // Validation
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo json_encode(['error' => 'Gecerli bir e-posta adresi giriniz']); return; }
        if (mb_strlen($name) < 2) { http_response_code(400); echo json_encode(['error' => 'Ad en az 2 karakter olmali']); return; }
        if (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password) || !preg_match('/[0-9]/', $password)) {
            http_response_code(400); echo json_encode(['error' => 'Sifre en az 8 karakter, 1 buyuk harf, 1 kucuk harf ve 1 rakam icermeli']); return;
        }

        // Check existing
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) { http_response_code(409); echo json_encode(['error' => 'Bu e-posta adresi zaten kayitli']); return; }

        // Create user — email_verified = 1 (e-posta servisi aktif olunca 0 yapilacak)
        $password_hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        $stmt = $pdo->prepare('INSERT INTO users (email, password_hash, name, phone, email_verified) VALUES (?, ?, ?, ?, 1)');
        $stmt->execute([$email, $password_hash, $name, $phone ?: null]);
        $user_id = (int)$pdo->lastInsertId();

        $token = jwt_encode(['user_id' => $user_id]);
        echo json_encode([
            'success' => true,
            'message' => 'Kayit basarili!',
            'token' => $token,
            'user' => ['id' => $user_id, 'email' => $email, 'name' => $name, 'phone' => $phone ?: null]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Kayit hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'Kayıt sırasında bir hata oluştu.']);
    }
}

function handle_login($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    if (!check_rate_limit('login', 5, 15)) return;

    $ip = get_client_ip();

    // Brute-force kontrolu: 5 ardisik basarisiz → 30dk ban
    $failCount = get_failed_login_count($ip);
    if ($failCount >= 5) {
        ban_ip($pdo, $ip, 'brute_force_login', 30);
        http_response_code(403);
        echo json_encode(['error' => 'Cok fazla basarisiz giris denemesi. IP adresiniz 30 dakika engellendi.']);
        return;
    }

    try {
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (!$email || !$password) { http_response_code(400); echo json_encode(['error' => 'E-posta ve sifre gerekli']); return; }

        $stmt = $pdo->prepare('SELECT id, email, password_hash, name, phone, email_verified, is_admin FROM users WHERE email = ? AND deleted_at IS NULL');
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            record_failed_login($ip, $email);

            // Admin kullanici icin 3 basarisiz → 60 dk ban
            if ($user && !empty($user['is_admin'])) {
                $currentFails = get_failed_login_count($ip);
                if ($currentFails >= 3) {
                    ban_ip($pdo, $ip, 'brute_force_admin', 60);
                    http_response_code(403);
                    echo json_encode(['error' => 'Admin hesabina cok fazla basarisiz giris. IP adresiniz 60 dakika engellendi.']);
                    return;
                }
            }

            http_response_code(401); echo json_encode(['error' => 'E-posta veya sifre hatali']); return;
        }

        // Basarili giris — sayaci sifirla
        clear_failed_logins($ip);

        // E-posta dogrulama kontrolu devre disi (e-posta servisi aktif olunca acilacak)
        // if (!$user['email_verified']) { ... }

        $token = jwt_encode(['user_id' => $user['id']]);
        echo json_encode([
            'message' => 'Giris basarili',
            'token' => $token,
            'user' => ['id' => (int)$user['id'], 'email' => $user['email'], 'name' => $user['name'], 'phone' => $user['phone'], 'is_admin' => (bool)($user['is_admin'] ?? false)]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Login hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'Giriş sırasında bir hata oluştu.']);
    }
}

function handle_profile($pdo) {
    try {
        $user_id = get_auth_user_id();
        if (!$user_id) { http_response_code(401); echo json_encode(['error' => 'Oturum gecersiz']); return; }

        $stmt = $pdo->prepare('SELECT id, email, name, phone, gsm, address_line1, address_line2, city, district, postal_code, tc_no, is_admin FROM users WHERE id = ? AND deleted_at IS NULL');
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) { http_response_code(404); echo json_encode(['error' => 'Kullanici bulunamadi']); return; }

        echo json_encode(['user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'phone' => $user['phone'],
            'gsm' => $user['gsm'] ?? null,
            'address_line1' => $user['address_line1'] ?? null,
            'address_line2' => $user['address_line2'] ?? null,
            'city' => $user['city'] ?? null,
            'district' => $user['district'] ?? null,
            'postal_code' => $user['postal_code'] ?? null,
            'tc_no' => ($user['tc_no'] ?? null) ? ('***' . substr($user['tc_no'], -4)) : null,
            'is_admin' => (bool)($user['is_admin'] ?? false),
        ]]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Profil hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'Profil bilgileri yüklenirken bir hata oluştu.']);
    }
}

function handle_verify_email($pdo) {
    if (!check_rate_limit('verify_email', 10, 15)) return;
    try {
        $token = trim($_GET['token'] ?? $_POST['token'] ?? '');
        if (!$token) { http_response_code(400); echo json_encode(['error' => 'Dogrulama tokeni gerekli']); return; }
        // Sifre sifirlama tokeni buraya getirilirse gecerli sayilmamali — aksi
        // halde sifirlama linki tuketilip gercek akis sessizce olurdu.
        if (!token_has_type($token, TOKEN_TYPE_VERIFY)) {
            http_response_code(400); echo json_encode(['error' => 'Gecersiz dogrulama linki']); return;
        }

        $stmt = $pdo->prepare('SELECT id, email_verified, verify_expires FROM users WHERE verify_token = ?');
        $stmt->execute([$token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) { http_response_code(400); echo json_encode(['error' => 'Gecersiz dogrulama linki']); return; }
        if ($user['email_verified']) { echo json_encode(['success' => true, 'message' => 'E-postaniz zaten dogrulandi']); return; }
        if ($user['verify_expires'] && strtotime($user['verify_expires']) < time()) {
            http_response_code(400); echo json_encode(['error' => 'Dogrulama linkinin suresi dolmus. Lutfen yeni bir link isteyin.']); return;
        }

        $stmt = $pdo->prepare('UPDATE users SET email_verified = 1, verify_token = NULL, verify_expires = NULL WHERE id = ?');
        $stmt->execute([$user['id']]);

        echo json_encode(['success' => true, 'message' => 'E-postaniz basariyla dogrulandi! Artik giris yapabilirsiniz.']);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Dogrulama hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'Doğrulama sırasında bir hata oluştu.']);
    }
}

function handle_resend_verify($pdo) {
    if (!check_rate_limit('resend_verify', 3, 15)) return;
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    try {
        $email = trim($_POST['email'] ?? '');
        if (!$email) { http_response_code(400); echo json_encode(['error' => 'E-posta adresi gerekli']); return; }

        $stmt = $pdo->prepare('SELECT id, name, email_verified, verify_expires FROM users WHERE email = ? AND deleted_at IS NULL');
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) { echo json_encode(['success' => true, 'message' => 'Eger bu e-posta kayitliysa dogrulama linki gonderildi.']); return; }
        if ($user['email_verified']) { echo json_encode(['success' => true, 'message' => 'E-postaniz zaten dogrulandi. Giris yapabilirsiniz.']); return; }

        // Rate limit: 5 min
        if ($user['verify_expires']) {
            $last_sent = strtotime($user['verify_expires']) - 86400; // verify_expires = sent_time + 24h
            if (time() - $last_sent < 300) {
                http_response_code(429); echo json_encode(['error' => 'Lutfen 5 dakika bekleyip tekrar deneyin.']); return;
            }
        }

        $verify_token = make_token(TOKEN_TYPE_VERIFY);
        $verify_expires = date('Y-m-d H:i:s', time() + VERIFY_TOKEN_TTL);
        $stmt = $pdo->prepare('UPDATE users SET verify_token = ?, verify_expires = ? WHERE id = ?');
        $stmt->execute([$verify_token, $verify_expires, $user['id']]);

        send_verification_email($email, $user['name'], $verify_token);
        echo json_encode(['success' => true, 'message' => 'Dogrulama e-postasi tekrar gonderildi.']);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Resend hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'İşlem sırasında bir hata oluştu.']);
    }
}

function handle_forgot_password($pdo) {
    if (!check_rate_limit('forgot_password', 3, 15)) return;
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    try {
        $email = trim($_POST['email'] ?? '');
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo json_encode(['error' => 'Gecerli bir e-posta adresi giriniz']); return; }

        $stmt = $pdo->prepare('SELECT id, name, verify_expires FROM users WHERE email = ? AND deleted_at IS NULL');
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Always return success to prevent email enumeration
        if (!$user) { echo json_encode(['success' => true, 'message' => 'Eger bu e-posta kayitliysa sifre sifirlama linki gonderildi.']); return; }

        // Rate limit: 5 dk.
        // Token 3600 sn omurle yaziliyor ama burada 86400 cikariliyordu; sonuc
        // her zaman 300'den buyuk cikip throttle'i tamamen devre disi birakiyordu.
        if ($user['verify_expires']) {
            $last_sent = strtotime($user['verify_expires']) - RESET_TOKEN_TTL;
            if (time() - $last_sent < 300) {
                http_response_code(429); echo json_encode(['error' => 'Lutfen 5 dakika bekleyip tekrar deneyin.']); return;
            }
        }

        $reset_token = make_token(TOKEN_TYPE_RESET);
        $reset_expires = date('Y-m-d H:i:s', time() + RESET_TOKEN_TTL);
        $stmt = $pdo->prepare('UPDATE users SET verify_token = ?, verify_expires = ? WHERE id = ?');
        $stmt->execute([$reset_token, $reset_expires, $user['id']]);

        send_reset_email($email, $user['name'], $reset_token);
        echo json_encode(['success' => true, 'message' => 'Sifre sifirlama linki e-posta adresinize gonderildi.']);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Sifre sifirlama hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'Şifre sıfırlama sırasında bir hata oluştu.']);
    }
}

function handle_reset_password($pdo) {
    if (!check_rate_limit('reset_password', 10, 15)) return;
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    try {
        $token = trim($_POST['token'] ?? '');
        $password = $_POST['password'] ?? '';

        if (!$token) { http_response_code(400); echo json_encode(['error' => 'Sifirlama tokeni gerekli']); return; }
        // Sizan bir e-posta dogrulama linki sifre sifirlamaya cevrilemez.
        if (!token_has_type($token, TOKEN_TYPE_RESET)) {
            http_response_code(400); echo json_encode(['error' => 'Gecersiz veya suresi dolmus sifirlama linki']); return;
        }
        if (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password) || !preg_match('/[0-9]/', $password)) {
            http_response_code(400); echo json_encode(['error' => 'Sifre en az 8 karakter, 1 buyuk harf, 1 kucuk harf ve 1 rakam icermeli']); return;
        }

        $stmt = $pdo->prepare('SELECT id, verify_expires FROM users WHERE verify_token = ?');
        $stmt->execute([$token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) { http_response_code(400); echo json_encode(['error' => 'Gecersiz veya suresi dolmus sifirlama linki']); return; }
        if ($user['verify_expires'] && strtotime($user['verify_expires']) < time()) {
            http_response_code(400); echo json_encode(['error' => 'Sifirlama linkinin suresi dolmus. Lutfen yeni bir link isteyin.']); return;
        }

        $password_hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $stmt = $pdo->prepare('UPDATE users SET password_hash = ?, verify_token = NULL, verify_expires = NULL, email_verified = 1 WHERE id = ?');
        $stmt->execute([$password_hash, $user['id']]);

        echo json_encode(['success' => true, 'message' => 'Sifreniz basariyla degistirildi! Artik giris yapabilirsiniz.']);
    } catch (Exception $e) {
        http_response_code(500);
        error_log('Sifre degistirme hatasi: ' . $e->getMessage());
        echo json_encode(['error' => 'Şifre değiştirme sırasında bir hata oluştu.']);
    }
}
