<?php
// DELETE /api/garage/remove?id=X (JWT required)

if ($method !== 'DELETE') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$userId = JWT::requireAuth();
$vehicleId = (int) ($_GET['id'] ?? 0);

// Validation - must be a positive integer
if ($vehicleId <= 0) {
    jsonResponse(['error' => 'Geçersiz araç ID'], 400);
}

// Check ownership
$vehicle = Database::fetchOne(
    "SELECT id FROM user_vehicles WHERE id = :id AND user_id = :user_id",
    ['id' => $vehicleId, 'user_id' => $userId]
);

if (!$vehicle) {
    jsonResponse(['error' => 'Araç bulunamadı veya yetkiniz yok'], 404);
}

Database::query(
    "DELETE FROM user_vehicles WHERE id = :id AND user_id = :user_id",
    ['id' => $vehicleId, 'user_id' => $userId]
);

jsonResponse(['message' => 'Araç garajdan silindi']);
