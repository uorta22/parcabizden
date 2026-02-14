<?php
// GET /api/models?brand_id=X

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$brandId = (int) ($_GET['brand_id'] ?? 0);

if (!$brandId) {
    jsonResponse(['error' => 'brand_id parametresi gerekli'], 400);
}

// Try MySQL first, fall back to SQLite
try {
    $models = Database::fetchAll(
        "SELECT id, name FROM models WHERE brand_id = :brand_id ORDER BY name ASC",
        ['brand_id' => $brandId]
    );

    if (!empty($models)) {
        jsonResponse(['data' => $models]);
    }
} catch (Exception $e) {
    // MySQL unavailable or empty, continue to SQLite fallback
}

// SQLite fallback
require_once __DIR__ . '/../vehicle_db.php';
$models = VehicleDB::getModels($brandId);
jsonResponse(['data' => $models]);
