<?php
// GET /api/segments?model_id=X (vehicles tablosundan)
// Artık "segment" = vehicle (KType bazlı)

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$modelId = (int) ($_GET['model_id'] ?? 0);

if (!$modelId) {
    jsonResponse(['error' => 'model_id parametresi gerekli'], 400);
}

$vehicles = CatalogDB::fetchAll(
    "SELECT v.id, v.description, v.full_name, v.year_from, v.year_to
     FROM vehicles v
     WHERE v.model_id = :model_id AND v.can_be_displayed = 1
     ORDER BY v.year_from DESC, v.description ASC",
    ['model_id' => $modelId]
);

$result = array_map(function($v) {
    return [
        'id' => (int)$v['id'],
        'name' => $v['description'],
        'full_name' => $v['full_name'],
        'year_start' => $v['year_from'] ? (int)$v['year_from'] : null,
        'year_end' => $v['year_to'] ? (int)$v['year_to'] : null,
    ];
}, $vehicles);

jsonResponse(['data' => $result]);
