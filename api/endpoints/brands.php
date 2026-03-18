<?php
// GET /api/brands
// Opsiyonel: ?popular=1 sadece popüler markalar

if ($method !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$popular = isset($_GET['popular']) && $_GET['popular'] === '1';

// Popüler marka ID'leri (manufacturers tablosundaki id'ler)
$popularIds = [5, 16, 74, 138, 111, 36, 93, 35, 183, 184, 88, 84, 45, 80, 72, 21, 120, 104, 139, 77, 109, 107];

// Manufacturer ismi → logo dosyası eşleştirme
$logoMap = [
    'ALFA ROMEO' => 'alfa-romeo.webp',
    'ASTON MARTIN' => 'aston-martin.webp',
    'CITROËN' => 'citroen.webp',
    'LAND ROVER' => 'land-rover.webp',
    'MERCEDES-BENZ' => 'mercedes-benz.webp',
    'ROLLS-ROYCE' => 'rolls-royce.webp',
    'ŠKODA' => 'skoda.webp',
];

if ($popular) {
    $placeholders = implode(',', array_fill(0, count($popularIds), '?'));
    $brands = CatalogDB::fetchAll(
        "SELECT id, name, matchcode FROM manufacturers WHERE id IN ($placeholders) ORDER BY name ASC",
        $popularIds
    );
} else {
    $brands = CatalogDB::fetchAll(
        "SELECT id, name, matchcode FROM manufacturers ORDER BY name ASC"
    );
}

// Logo dosya adını üret
$result = array_map(function($brand) use ($logoMap) {
    $name = $brand['name'];
    // Özel mapping varsa kullan
    if (isset($logoMap[$name])) {
        $logoFile = $logoMap[$name];
    } else {
        // İsmi slug'a çevir: küçük harf, boşluk → tire
        $logoFile = strtolower(str_replace([' ', '.'], ['-', ''], $name)) . '.webp';
    }

    return [
        'id' => (int)$brand['id'],
        'name' => $brand['name'],
        'logo_file' => $logoFile,
    ];
}, $brands);

jsonResponse(['data' => $result]);
