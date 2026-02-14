<?php
// GET /api/search?q=motor&page=1

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$query = trim($_GET['q'] ?? '');

// Validation
if (strlen($query) < 2) {
    jsonResponse(['error' => 'Arama terimi en az 2 karakter olmalı'], 400);
}

if (strlen($query) > 100) {
    jsonResponse(['error' => 'Arama terimi en fazla 100 karakter olmalı'], 400);
}

// Whitelist allowed characters (alphanumeric, Turkish chars, spaces, hyphens)
if (!preg_match('/^[a-zA-Z0-9çÇğĞıİöÖşŞüÜ\s\-]+$/u', $query)) {
    jsonResponse(['error' => 'Arama terimi geçersiz karakterler içeriyor'], 400);
}

// Sanitize search input
$query = htmlspecialchars($query, ENT_QUOTES, 'UTF-8');

[$page, $limit, $offset] = getPagination();

// Use FULLTEXT search if available, fallback to LIKE
$searchTerm = "%$query%";

$totalSql = "SELECT COUNT(*) FROM parts p
             JOIN categories c ON p.category_id = c.id
             WHERE p.name LIKE :q1 OR p.description LIKE :q2 OR p.oem_number LIKE :q3 OR c.name LIKE :q4";

$total = Database::count($totalSql, [
    'q1' => $searchTerm,
    'q2' => $searchTerm,
    'q3' => $searchTerm,
    'q4' => $searchTerm
]);

$sql = "SELECT p.id, p.oem_number, p.name, p.description, p.part_type, p.position,
               c.slug AS category_slug, c.name AS category_name
        FROM parts p
        JOIN categories c ON p.category_id = c.id
        WHERE p.name LIKE :q1 OR p.description LIKE :q2 OR p.oem_number LIKE :q3 OR c.name LIKE :q4
        ORDER BY
            CASE WHEN p.name LIKE :q5 THEN 0 ELSE 1 END,
            p.name ASC
        LIMIT $limit OFFSET $offset";

$parts = Database::fetchAll($sql, [
    'q1' => $searchTerm,
    'q2' => $searchTerm,
    'q3' => $searchTerm,
    'q4' => $searchTerm,
    'q5' => "$query%"
]);

jsonResponse([
    'data' => $parts,
    'query' => $query,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => ceil($total / $limit)
    ]
]);
