<?php
// GET /api/search?q=fren+balatası&page=1
// Parça numarası, tedarikçi adı ve kategori adında arama

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

if (!CatalogDB::isAvailable()) {
    jsonResponse(['error' => 'Katalog veritabanı henüz hazır değil'], 503);
}

$query = trim($_GET['q'] ?? '');

// Validasyon
if (strlen($query) < 2) {
    jsonResponse(['error' => 'Arama terimi en az 2 karakter olmalı'], 400);
}

if (strlen($query) > 100) {
    jsonResponse(['error' => 'Arama terimi en fazla 100 karakter olmalı'], 400);
}

// Karakter whitelist (alfanümerik, Türkçe karakterler, boşluk, tire, nokta)
if (!preg_match('/^[a-zA-Z0-9çÇğĞıİöÖşŞüÜ\s\-\.\/]+$/u', $query)) {
    jsonResponse(['error' => 'Arama terimi geçersiz karakterler içeriyor'], 400);
}

$query = htmlspecialchars($query, ENT_QUOTES, 'UTF-8');

[$page, $limit, $offset] = getPagination();

$searchTerm = "%$query%";

// Parça numarasında veya tedarikçi adında ara
$totalSql = "SELECT COUNT(DISTINCT p.id)
             FROM parts p
             JOIN suppliers s ON s.id = p.supplier_id
             WHERE p.part_number LIKE :q1 OR s.name LIKE :q2";

$total = CatalogDB::count($totalSql, [
    'q1' => $searchTerm,
    'q2' => $searchTerm,
]);

$sql = "SELECT DISTINCT p.id, p.part_number, s.name as supplier_name, s.id as supplier_id
        FROM parts p
        JOIN suppliers s ON s.id = p.supplier_id
        WHERE p.part_number LIKE :q1 OR s.name LIKE :q2
        ORDER BY
            CASE WHEN p.part_number LIKE :q3 THEN 0 ELSE 1 END,
            s.name ASC, p.part_number ASC
        LIMIT $limit OFFSET $offset";

$parts = CatalogDB::fetchAll($sql, [
    'q1' => $searchTerm,
    'q2' => $searchTerm,
    'q3' => "$query%",
]);

$result = array_map(function($part) {
    return [
        'id' => (int)$part['id'],
        'part_number' => $part['part_number'],
        'supplier_name' => $part['supplier_name'],
        'supplier_id' => (int)$part['supplier_id'],
    ];
}, $parts);

jsonResponse([
    'data' => $result,
    'query' => $query,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => (int)ceil($total / $limit)
    ]
]);
