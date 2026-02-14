<?php
// GET /api/segments?model_id=X

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$modelId = (int) ($_GET['model_id'] ?? 0);

if (!$modelId) {
    jsonResponse(['error' => 'model_id parametresi gerekli'], 400);
}

$segments = Database::fetchAll(
    "SELECT id, name, year_start, year_end, body_type, engine_type
     FROM segments
     WHERE model_id = :model_id
     ORDER BY year_start DESC, name ASC",
    ['model_id' => $modelId]
);

jsonResponse(['data' => $segments]);
