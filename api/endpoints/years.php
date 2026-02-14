<?php
// GET /api/years?segment_id=X

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$segmentId = (int) ($_GET['segment_id'] ?? 0);

if (!$segmentId) {
    jsonResponse(['error' => 'segment_id parametresi gerekli'], 400);
}

$segment = Database::fetchOne(
    "SELECT year_start, year_end FROM segments WHERE id = :id",
    ['id' => $segmentId]
);

if (!$segment) {
    jsonResponse(['error' => 'Segment bulunamadı'], 404);
}

$years = [];
for ($y = $segment['year_end']; $y >= $segment['year_start']; $y--) {
    $years[] = $y;
}

jsonResponse(['data' => $years]);
