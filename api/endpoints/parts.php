<?php
// GET /api/parts?vehicle_id=X&category_id=Y&page=1
// Opsiyonel: ?group=assembly_group (ana grup bazlı filtreleme)
// Opsiyonel: ?supplier_id=Z (tedarikçi filtresi)

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

[$page, $limit, $offset] = getPagination();

$vehicleId = (int) ($_GET['vehicle_id'] ?? 0);
$categoryId = (int) ($_GET['category_id'] ?? 0);
$group = $_GET['group'] ?? '';
$supplierId = (int) ($_GET['supplier_id'] ?? 0);

// En az vehicle_id veya category_id gerekli — 78M satırlık tabloyu başıboş taratmayalım
if (!$vehicleId && !$categoryId && !$supplierId) {
    jsonResponse(['error' => 'vehicle_id, category_id veya supplier_id parametrelerinden en az biri gerekli'], 400);
}

$where = [];
$params = [];

if ($vehicleId) {
    $where[] = "pv.vehicle_id = :vehicle_id";
    $params['vehicle_id'] = $vehicleId;
}

if ($categoryId) {
    $where[] = "pv.category_id = :category_id";
    $params['category_id'] = $categoryId;
}

if ($group) {
    $where[] = "c.assembly_group_tr = :group";
    $params['group'] = $group;
}

if ($supplierId) {
    $where[] = "p.supplier_id = :supplier_id";
    $params['supplier_id'] = $supplierId;
}

$whereClause = 'WHERE ' . implode(' AND ', $where);

// Toplam sayım
$totalSql = "SELECT COUNT(DISTINCT p.id)
             FROM part_vehicles pv
             JOIN parts p ON p.id = pv.part_id
             JOIN categories c ON c.id = pv.category_id
             $whereClause";
$total = CatalogDB::count($totalSql, $params);

// Parçaları getir
$sql = "SELECT DISTINCT p.id, p.part_number,
               s.name as supplier_name, s.id as supplier_id,
               c.description_tr as category_name,
               c.assembly_group_tr as category_group,
               c.normalized_tr as category_short
        FROM part_vehicles pv
        JOIN parts p ON p.id = pv.part_id
        JOIN suppliers s ON s.id = p.supplier_id
        JOIN categories c ON c.id = pv.category_id
        $whereClause
        ORDER BY s.name ASC, p.part_number ASC
        LIMIT $limit OFFSET $offset";

$parts = CatalogDB::fetchAll($sql, $params);

$result = array_map(function($part) {
    return [
        'id' => (int)$part['id'],
        'part_number' => $part['part_number'],
        'supplier_name' => $part['supplier_name'],
        'supplier_id' => (int)$part['supplier_id'],
        'category_name' => $part['category_name'],
        'category_group' => $part['category_group'],
        'category_short' => $part['category_short'],
    ];
}, $parts);

jsonResponse([
    'data' => $result,
    'pagination' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => (int)ceil($total / $limit)
    ]
]);
