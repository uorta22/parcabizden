<?php
// GET /api/vehicle-detail?vehicle_id=X
// Araç detay bilgisi: motor, özellikler, uyumlu araç sayısı

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$vehicleId = (int) ($_GET['vehicle_id'] ?? 0);

if (!$vehicleId) {
    jsonResponse(['error' => 'vehicle_id parametresi gerekli'], 400);
}

// Araç temel bilgileri
$vehicle = CatalogDB::fetchOne(
    "SELECT v.id, v.description, v.full_name, v.year_from, v.year_to,
            m.name as model_name, m.full_name as model_full_name,
            mfr.name as manufacturer_name, mfr.id as manufacturer_id
     FROM vehicles v
     JOIN models m ON m.id = v.model_id
     JOIN manufacturers mfr ON mfr.id = m.manufacturer_id
     WHERE v.id = :id",
    ['id' => $vehicleId]
);

if (!$vehicle) {
    jsonResponse(['error' => 'Araç bulunamadı'], 404);
}

// Araç özellikleri
$attributes = CatalogDB::fetchAll(
    "SELECT attribute_group, attribute_type, display_title, display_value
     FROM vehicle_attributes
     WHERE vehicle_id = :id
     ORDER BY attribute_group, attribute_type",
    ['id' => $vehicleId]
);

// Motor bilgileri
$engines = CatalogDB::fetchAll(
    "SELECT e.code, e.description, e.full_name, e.year_range
     FROM vehicle_engines ve
     JOIN engines e ON e.id = ve.engine_id
     WHERE ve.vehicle_id = :id",
    ['id' => $vehicleId]
);

// Toplam parça sayısı
$partCount = CatalogDB::count(
    "SELECT COUNT(DISTINCT part_id) FROM part_vehicles WHERE vehicle_id = :id",
    ['id' => $vehicleId]
);

// Özellikleri gruplara ayır
$groupedAttributes = [];
foreach ($attributes as $attr) {
    $group = $attr['attribute_group'] ?: 'Genel';
    if (!isset($groupedAttributes[$group])) {
        $groupedAttributes[$group] = [];
    }
    $groupedAttributes[$group][] = [
        'type' => $attr['attribute_type'],
        'title' => $attr['display_title'],
        'value' => $attr['display_value'],
    ];
}

jsonResponse([
    'data' => [
        'id' => (int)$vehicle['id'],
        'description' => $vehicle['description'],
        'full_name' => $vehicle['full_name'],
        'year_from' => $vehicle['year_from'] ? (int)$vehicle['year_from'] : null,
        'year_to' => $vehicle['year_to'] ? (int)$vehicle['year_to'] : null,
        'model_name' => $vehicle['model_name'],
        'manufacturer_name' => $vehicle['manufacturer_name'],
        'manufacturer_id' => (int)$vehicle['manufacturer_id'],
        'part_count' => $partCount,
        'engines' => array_map(function($e) {
            return [
                'code' => $e['code'],
                'description' => $e['description'],
                'full_name' => $e['full_name'],
                'year_range' => $e['year_range'],
            ];
        }, $engines),
        'attributes' => $groupedAttributes,
    ]
]);
