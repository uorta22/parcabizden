<?php
// POST /api/auth/login
// Body: { email, password }

if ($method !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$body = getJsonBody();

$email = trim($body['email'] ?? '');
$password = $body['password'] ?? '';

// Validation
if (!$email || !$password) {
    jsonResponse(['error' => 'E-posta ve şifre gerekli'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Geçersiz kimlik bilgileri'], 401);
}

if (strlen($email) > 255) {
    jsonResponse(['error' => 'Geçersiz kimlik bilgileri'], 401);
}

// Find user
$user = Database::fetchOne(
    "SELECT id, email, password_hash, name, phone FROM users WHERE email = :email",
    ['email' => $email]
);

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonResponse(['error' => 'Geçersiz kimlik bilgileri'], 401);
}

// Generate token
$token = JWT::encode([
    'user_id' => (int) $user['id'],
    'email' => $user['email']
]);

jsonResponse([
    'message' => 'Giriş başarılı',
    'token' => $token,
    'user' => [
        'id' => (int) $user['id'],
        'email' => $user['email'],
        'name' => $user['name'],
        'phone' => $user['phone']
    ]
]);
