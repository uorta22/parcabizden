<?php
// GET /api/categories
// Opsiyonel: ?vehicle_id=X — belirli araca ait kategoriler (parça sayısıyla)
// Opsiyonel: ?group=assembly_group — grup altındaki alt kategoriler
// Varsayılan: assembly_group_tr bazlı ana gruplar

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$vehicleId = (int) ($_GET['vehicle_id'] ?? 0);
$group = $_GET['group'] ?? '';

// Belirli bir grubun alt kategorilerini getir
if ($group) {
    if ($vehicleId) {
        // Araç bazlı alt kategoriler (parça sayısıyla)
        $categories = CatalogDB::fetchAll(
            "SELECT c.id, c.description_tr as name, c.normalized_tr as short_name,
                    c.usage_tr as usage_context,
                    COUNT(DISTINCT pv.part_id) as part_count
             FROM categories c
             JOIN part_vehicles pv ON pv.category_id = c.id AND pv.vehicle_id = :vehicle_id
             WHERE c.assembly_group_tr = :group
             GROUP BY c.id
             HAVING part_count > 0
             ORDER BY part_count DESC",
            ['vehicle_id' => $vehicleId, 'group' => $group]
        );
    } else {
        // Genel alt kategoriler
        $categories = CatalogDB::fetchAll(
            "SELECT id, description_tr as name, normalized_tr as short_name,
                    usage_tr as usage_context
             FROM categories
             WHERE assembly_group_tr = :group AND assembly_group_tr != ''
             ORDER BY description_tr ASC",
            ['group' => $group]
        );
    }

    jsonResponse(['data' => $categories, 'group' => $group]);
}

// Ana gruplar (assembly_group_tr bazlı)
if ($vehicleId) {
    // Araç bazlı ana gruplar — sadece parçası olanlar
    $groups = CatalogDB::fetchAll(
        "SELECT c.assembly_group_tr as name,
                COUNT(DISTINCT pv.part_id) as part_count,
                COUNT(DISTINCT c.id) as subcategory_count
         FROM part_vehicles pv
         JOIN categories c ON pv.category_id = c.id
         WHERE pv.vehicle_id = :vehicle_id AND c.assembly_group_tr != ''
         GROUP BY c.assembly_group_tr
         ORDER BY part_count DESC",
        ['vehicle_id' => $vehicleId]
    );
} else {
    // Tüm ana gruplar
    $groups = CatalogDB::fetchAll(
        "SELECT assembly_group_tr as name,
                COUNT(*) as subcategory_count
         FROM categories
         WHERE assembly_group_tr != ''
         GROUP BY assembly_group_tr
         ORDER BY assembly_group_tr ASC"
    );
}

jsonResponse(['data' => $groups]);
