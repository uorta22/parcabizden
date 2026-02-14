<?php
// GET /api/auth/profile (JWT required)

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$userId = JWT::requireAuth();

$user = Database::fetchOne(
    "SELECT id, email, name, phone, created_at FROM users WHERE id = :id",
    ['id' => $userId]
);

if (!$user) {
    jsonResponse(['error' => 'Kullanıcı bulunamadı'], 404);
}

// Get vehicle count
$vehicleCount = Database::count(
    "SELECT COUNT(*) FROM user_vehicles WHERE user_id = :user_id",
    ['user_id' => $userId]
);

jsonResponse([
    'data' => [
        'id' => (int) $user['id'],
        'email' => $user['email'],
        'name' => $user['name'],
        'phone' => $user['phone'],
        'vehicle_count' => $vehicleCount,
        'created_at' => $user['created_at']
    ]
]);
