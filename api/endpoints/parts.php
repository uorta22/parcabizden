<?php
// GET /api/parts?category=slug&brand_id=X&model_id=X&year=2020&page=1

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

[$page, $limit, $offset] = getPagination();

$where = [];
$params = [];

// Filter by category slug
if (!empty($_GET['category'])) {
    $where[] = "c.slug = :category";
    $params['category'] = $_GET['category'];
}

// Filter by brand compatibility
if (!empty($_GET['brand_id'])) {
    $brandId = (int) $_GET['brand_id'];
    $where[] = "EXISTS (
        SELECT 1 FROM part_compatibility pc
        JOIN segments s ON pc.segment_id = s.id
        JOIN models m ON s.model_id = m.id
        WHERE pc.part_id = p.id AND m.brand_id = :brand_id
    )";
    $params['brand_id'] = $brandId;
}

// Filter by model compatibility
if (!empty($_GET['model_id'])) {
    $modelId = (int) $_GET['model_id'];
    $where[] = "EXISTS (
        SELECT 1 FROM part_compatibility pc
        JOIN segments s ON pc.segment_id = s.id
        WHERE pc.part_id = p.id AND s.model_id = :model_id
    )";
    $params['model_id'] = $modelId;
}

// Filter by year compatibility
if (!empty($_GET['year'])) {
    $year = (int) $_GET['year'];
    $where[] = "EXISTS (
        SELECT 1 FROM part_compatibility pc
        WHERE pc.part_id = p.id AND pc.year_start <= :year AND pc.year_end >= :year
    )";
    $params['year'] = $year;
}

$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// Count total
$totalSql = "SELECT COUNT(*) FROM parts p JOIN categories c ON p.category_id = c.id $whereClause";
$total = Database::count($totalSql, $params);

// Fetch parts
$sql = "SELECT p.id, p.oem_number, p.name, p.description, p.part_type, p.position,
               c.slug AS category_slug, c.name AS category_name
        FROM parts p
        JOIN categories c ON p.category_id = c.id
        $whereClause
        ORDER BY p.name ASC
        LIMIT $limit OFFSET $offset";

$parts = Database::fetchAll($sql, $params);

jsonResponse([
    'data' => $parts,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => ceil($total / $limit)
    ]
]);
