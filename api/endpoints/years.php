<?php
// GET /api/years?vehicle_id=X
// Geriye uyumluluk: segment_id parametresi de kabul edilir

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$vehicleId = (int) ($_GET['vehicle_id'] ?? $_GET['segment_id'] ?? 0);

if (!$vehicleId) {
    jsonResponse(['error' => 'vehicle_id parametresi gerekli'], 400);
}

$vehicle = CatalogDB::fetchOne(
    "SELECT year_from, year_to FROM vehicles WHERE id = :id",
    ['id' => $vehicleId]
);

if (!$vehicle) {
    jsonResponse(['error' => 'Araç bulunamadı'], 404);
}

$yearFrom = (int)$vehicle['year_from'];
$yearTo = $vehicle['year_to'] ? (int)$vehicle['year_to'] : (int)date('Y');

$years = [];
for ($y = $yearTo; $y >= $yearFrom; $y--) {
    $years[] = $y;
}

jsonResponse(['data' => $years]);
