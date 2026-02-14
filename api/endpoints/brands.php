<?php
// GET /api/brands
// Optional: ?popular=1 to get only popular brands

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$popular = isset($_GET['popular']) && $_GET['popular'] === '1';

// Try MySQL first, fall back to SQLite
try {
    if ($popular) {
        $brands = Database::fetchAll(
            "SELECT id, name, logo_file FROM brands WHERE is_popular = 1 ORDER BY name ASC"
        );
    } else {
        $brands = Database::fetchAll(
            "SELECT id, name, logo_file FROM brands ORDER BY name ASC"
        );
    }

    if (!empty($brands)) {
        jsonResponse(['data' => $brands]);
    }
} catch (Exception $e) {
    // MySQL unavailable or empty, continue to SQLite fallback
}

// SQLite fallback
require_once __DIR__ . '/../vehicle_db.php';
$brands = VehicleDB::getBrands($popular);
jsonResponse(['data' => $brands]);
