<?php
// POST /api/garage/add (JWT required)
// Body: { brand_id, model_id, segment_id?, year, nickname? }

if ($method !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$userId = JWT::requireAuth();
$body = getJsonBody();

$brandId = (int) ($body['brand_id'] ?? 0);
$modelId = (int) ($body['model_id'] ?? 0);
$segmentId = !empty($body['segment_id']) ? (int) $body['segment_id'] : null;
$year = (int) ($body['year'] ?? 0);
$nickname = trim($body['nickname'] ?? '');

// Validation - IDs must be positive integers
if ($brandId <= 0) {
    jsonResponse(['error' => 'Geçersiz marka'], 400);
}

if ($modelId <= 0) {
    jsonResponse(['error' => 'Geçersiz model'], 400);
}

if ($segmentId !== null && $segmentId <= 0) {
    jsonResponse(['error' => 'Geçersiz segment'], 400);
}

// Validation - Year
if (!$year) {
    jsonResponse(['error' => 'Yıl bilgisi gerekli'], 400);
}

if ($year < 1950 || $year > (int) date('Y') + 1) {
    jsonResponse(['error' => 'Geçersiz yıl'], 400);
}

// Validation - Nickname (optional)
if (!empty($nickname)) {
    if (strlen($nickname) > 100) {
        jsonResponse(['error' => 'Takma ad en fazla 100 karakter olmalı'], 400);
    }
    $nickname = htmlspecialchars($nickname, ENT_QUOTES, 'UTF-8');
}

// Verify brand and model exist
$brand = Database::fetchOne("SELECT id, name FROM brands WHERE id = :id", ['id' => $brandId]);
if (!$brand) {
    jsonResponse(['error' => 'Marka bulunamadı'], 404);
}

$model = Database::fetchOne(
    "SELECT id, name FROM models WHERE id = :id AND brand_id = :brand_id",
    ['id' => $modelId, 'brand_id' => $brandId]
);
if (!$model) {
    jsonResponse(['error' => 'Model bulunamadı'], 404);
}

// Check limit (max 10 vehicles per user)
$count = Database::count(
    "SELECT COUNT(*) FROM user_vehicles WHERE user_id = :user_id",
    ['user_id' => $userId]
);
if ($count >= 10) {
    jsonResponse(['error' => 'En fazla 10 araç ekleyebilirsiniz'], 400);
}

// Insert
$vehicleId = Database::insert(
    "INSERT INTO user_vehicles (user_id, brand_id, model_id, segment_id, year, nickname, created_at)
     VALUES (:user_id, :brand_id, :model_id, :segment_id, :year, :nickname, NOW())",
    [
        'user_id' => $userId,
        'brand_id' => $brandId,
        'model_id' => $modelId,
        'segment_id' => $segmentId,
        'year' => $year,
        'nickname' => $nickname ?: null
    ]
);

jsonResponse([
    'message' => 'Araç garaja eklendi',
    'data' => [
        'id' => (int) $vehicleId,
        'brand_name' => $brand['name'],
        'model_name' => $model['name'],
        'year' => $year,
        'nickname' => $nickname
    ]
], 201);
