<?php
// GET /api/models?manufacturer_id=X
// Geriye uyumluluk: brand_id parametresi de kabul edilir

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$manufacturerId = (int) ($_GET['manufacturer_id'] ?? $_GET['brand_id'] ?? 0);

if (!$manufacturerId) {
    jsonResponse(['error' => 'manufacturer_id parametresi gerekli'], 400);
}

$models = CatalogDB::fetchAll(
    "SELECT m.id, m.name, m.full_name, m.year_range,
            COUNT(DISTINCT v.id) as vehicle_count
     FROM models m
     LEFT JOIN vehicles v ON v.model_id = m.id AND v.can_be_displayed = 1
     WHERE m.manufacturer_id = :manufacturer_id
     GROUP BY m.id
     HAVING vehicle_count > 0
     ORDER BY m.name ASC",
    ['manufacturer_id' => $manufacturerId]
);

$result = array_map(function($model) {
    return [
        'id' => (int)$model['id'],
        'name' => $model['name'],
        'full_name' => $model['full_name'],
        'year_range' => $model['year_range'],
        'vehicle_count' => (int)$model['vehicle_count'],
    ];
}, $models);

jsonResponse(['data' => $result]);
