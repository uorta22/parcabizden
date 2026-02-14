<?php
// GET /api/garage/list (JWT required)

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$userId = JWT::requireAuth();

$vehicles = Database::fetchAll(
    "SELECT uv.id, uv.year, uv.nickname, uv.created_at,
            b.id AS brand_id, b.name AS brand_name, b.logo_file AS brand_logo,
            m.id AS model_id, m.name AS model_name,
            s.id AS segment_id, s.name AS segment_name, s.body_type, s.engine_type
     FROM user_vehicles uv
     JOIN brands b ON uv.brand_id = b.id
     JOIN models m ON uv.model_id = m.id
     LEFT JOIN segments s ON uv.segment_id = s.id
     WHERE uv.user_id = :user_id
     ORDER BY uv.created_at DESC",
    ['user_id' => $userId]
);

jsonResponse(['data' => $vehicles]);
