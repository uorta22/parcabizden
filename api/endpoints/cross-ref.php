<?php
// GET /api/cross-ref?part_number=X&supplier_id=Y
// Bir parçanın muadil/alternatif parçalarını getirir

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$partNumber = trim($_GET['part_number'] ?? '');
$supplierId = (int) ($_GET['supplier_id'] ?? 0);

if (!$partNumber) {
    jsonResponse(['error' => 'part_number parametresi gerekli'], 400);
}

$where = "cr.part_number LIKE :part_number";
$params = ['part_number' => $partNumber];

if ($supplierId) {
    $where .= " AND cr.supplier_id = :supplier_id";
    $params['supplier_id'] = $supplierId;
}

$refs = CatalogDB::fetchAll(
    "SELECT cr.ref_part_number as part_number,
            s.name as supplier_name, s.id as supplier_id,
            cr.ref_type as type
     FROM cross_ref cr
     JOIN suppliers s ON s.id = cr.ref_supplier_id
     WHERE $where
     ORDER BY cr.ref_type, s.name ASC",
    $params
);

jsonResponse(['data' => $refs, 'source_part' => $partNumber]);
