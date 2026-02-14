<?php
// GET /api/categories

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$categories = Database::fetchAll(
    "SELECT c.id, c.slug, c.name, c.description, c.icon,
            COUNT(p.id) AS part_count
     FROM categories c
     LEFT JOIN parts p ON p.category_id = c.id
     GROUP BY c.id
     ORDER BY c.name ASC"
);

jsonResponse(['data' => $categories]);
