<?php
// POST /api/auth/register
// Body: { email, password, name, phone? }

if ($method !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$body = getJsonBody();

$email = trim($body['email'] ?? '');
$password = $body['password'] ?? '';
$name = trim($body['name'] ?? '');
$phone = trim($body['phone'] ?? '');

// Validation - Email
if (!$email || strlen($email) > 255) {
    jsonResponse(['error' => 'E-posta adresi gerekli ve 255 karakterden kısa olmalı'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Geçerli bir e-posta adresi girin'], 400);
}

// Validation - Password
if (strlen($password) < 8) {
    jsonResponse(['error' => 'Şifre en az 8 karakter olmalı'], 400);
}

if (strlen($password) > 72) {
    jsonResponse(['error' => 'Şifre en fazla 72 karakter olmalı'], 400);
}

if (!preg_match('/[A-Z]/', $password)) {
    jsonResponse(['error' => 'Şifre en az 1 büyük harf içermeli'], 400);
}

if (!preg_match('/[a-z]/', $password)) {
    jsonResponse(['error' => 'Şifre en az 1 küçük harf içermeli'], 400);
}

if (!preg_match('/[0-9]/', $password)) {
    jsonResponse(['error' => 'Şifre en az 1 rakam içermeli'], 400);
}

// Validation - Name
if (strlen($name) < 2) {
    jsonResponse(['error' => 'Ad en az 2 karakter olmalı'], 400);
}

if (strlen($name) > 100) {
    jsonResponse(['error' => 'Ad en fazla 100 karakter olmalı'], 400);
}

$name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');

// Validation - Phone (optional)
if (!empty($phone)) {
    // Turkish phone format: +90XXXXXXXXXX or 0XXXXXXXXXX or just 10 digits
    $phoneClean = preg_replace('/[\s\-\(\)]/', '', $phone);

    if (!preg_match('/^(\+90|0)?[1-9][0-9]{9}$/', $phoneClean)) {
        jsonResponse(['error' => 'Geçersiz telefon numarası formatı'], 400);
    }

    if (strlen($phone) > 20) {
        jsonResponse(['error' => 'Telefon numarası çok uzun'], 400);
    }
}

// Check if email exists
$existing = Database::fetchOne(
    "SELECT id FROM users WHERE email = :email",
    ['email' => $email]
);

if ($existing) {
    jsonResponse(['error' => 'Bu e-posta adresi zaten kayıtlı'], 409);
}

// Create user
$passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

$userId = Database::insert(
    "INSERT INTO users (email, password_hash, name, phone, created_at)
     VALUES (:email, :password_hash, :name, :phone, NOW())",
    [
        'email' => $email,
        'password_hash' => $passwordHash,
        'name' => $name,
        'phone' => $phone
    ]
);

// Generate token
$token = JWT::encode([
    'user_id' => (int) $userId,
    'email' => $email
]);

jsonResponse([
    'message' => 'Kayıt başarılı',
    'token' => $token,
    'user' => [
        'id' => (int) $userId,
        'email' => $email,
        'name' => $name
    ]
], 201);
