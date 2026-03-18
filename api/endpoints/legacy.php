<?php
/**
 * Eski action-tabanlı API istekleri için geriye uyumluluk katmanı
 * Frontend'deki fetchAutodataBrands, fetchAutodataModels vb. fonksiyonlar
 * ?action=autodata_brands formatında istek yapar
 * Bu dosya yeni CatalogDB üzerinden eski format'ta yanıt döner
 */

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'autodata_brands':
        legacy_autodata_brands();
        break;
    case 'autodata_models':
        legacy_autodata_models();
        break;
    case 'autodata_generations':
        legacy_autodata_generations();
        break;
    case 'autodata_resolve_slug':
        legacy_autodata_resolve_slug();
        break;
    default:
        jsonResponse(['error' => 'Bilinmeyen action: ' . $action], 404);
}

/**
 * Marka listesi — eski format: { brands: [{ name, slug, model_count, total }] }
 */
function legacy_autodata_brands(): void {
    if (!CatalogDB::isAvailable()) {
        jsonResponse(['brands' => [], 'error' => 'Katalog veritabanı henüz hazır değil']);
        return;
    }

    $manufacturers = CatalogDB::fetchAll(
        "SELECT m.id, m.name, COUNT(DISTINCT mo.id) as model_count,
                COUNT(DISTINCT v.id) as total
         FROM manufacturers m
         LEFT JOIN models mo ON mo.manufacturer_id = m.id
         LEFT JOIN vehicles v ON v.model_id = mo.id AND v.can_be_displayed = 1
         GROUP BY m.id
         HAVING total > 0
         ORDER BY m.name ASC"
    );

    $brands = array_map(function($m) {
        $slug = strtolower(trim($m['name']));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        return [
            'name' => $m['name'],
            'slug' => $slug,
            'model_count' => (int)$m['model_count'],
            'total' => (int)$m['total'],
        ];
    }, $manufacturers);

    jsonResponse(['brands' => $brands]);
}

/**
 * Model listesi — eski format: { models: [{ name, gen_count, min_year, max_year }], brand }
 */
function legacy_autodata_models(): void {
    $brandSlug = trim($_GET['brand'] ?? '');
    if (!$brandSlug) {
        jsonResponse(['error' => 'brand parametresi gerekli'], 400);
        return;
    }

    if (!CatalogDB::isAvailable()) {
        jsonResponse(['models' => [], 'brand' => $brandSlug]);
        return;
    }

    // Slug'dan manufacturer bul
    $manufacturer = resolve_manufacturer_by_slug($brandSlug);
    if (!$manufacturer) {
        jsonResponse(['models' => [], 'brand' => $brandSlug]);
        return;
    }

    $models = CatalogDB::fetchAll(
        "SELECT mo.name, COUNT(DISTINCT v.id) as gen_count,
                MIN(v.year_from) as min_year, MAX(COALESCE(v.year_to, 2025)) as max_year
         FROM models mo
         LEFT JOIN vehicles v ON v.model_id = mo.id AND v.can_be_displayed = 1
         WHERE mo.manufacturer_id = :mid
         GROUP BY mo.id
         HAVING gen_count > 0
         ORDER BY mo.name ASC",
        ['mid' => $manufacturer['id']]
    );

    $result = array_map(function($m) {
        return [
            'name' => $m['name'],
            'gen_count' => (int)$m['gen_count'],
            'min_year' => $m['min_year'] !== null ? (int)$m['min_year'] : null,
            'max_year' => $m['max_year'] !== null ? (int)$m['max_year'] : null,
        ];
    }, $models);

    jsonResponse(['models' => $result, 'brand' => $manufacturer['name']]);
}

/**
 * Nesil/araç listesi — eski format: { generations: [{ name, year_start, year_end, body_type, mod_count }] }
 */
function legacy_autodata_generations(): void {
    $brandSlug = trim($_GET['brand'] ?? '');
    $modelName = trim($_GET['model'] ?? '');
    if (!$brandSlug || !$modelName) {
        jsonResponse(['error' => 'brand ve model parametreleri gerekli'], 400);
        return;
    }

    if (!CatalogDB::isAvailable()) {
        jsonResponse(['generations' => []]);
        return;
    }

    $manufacturer = resolve_manufacturer_by_slug($brandSlug);
    if (!$manufacturer) {
        jsonResponse(['generations' => []]);
        return;
    }

    // Model'i bul — tam isim eşleşmesi
    $model = CatalogDB::fetchOne(
        "SELECT id FROM models WHERE manufacturer_id = :mid AND name = :name",
        ['mid' => $manufacturer['id'], 'name' => $modelName]
    );

    if (!$model) {
        jsonResponse(['generations' => []]);
        return;
    }

    $vehicles = CatalogDB::fetchAll(
        "SELECT description, full_name, year_from, year_to, COUNT(*) as mod_count
         FROM vehicles
         WHERE model_id = :mid AND can_be_displayed = 1
         GROUP BY description
         ORDER BY year_from DESC",
        ['mid' => $model['id']]
    );

    $generations = array_map(function($v) {
        return [
            'name' => $v['description'] ?: $v['full_name'],
            'year_start' => $v['year_from'] !== null ? (int)$v['year_from'] : null,
            'year_end' => $v['year_to'] !== null ? (int)$v['year_to'] : null,
            'body_type' => null,
            'mod_count' => (int)$v['mod_count'],
        ];
    }, $vehicles);

    jsonResponse(['generations' => $generations]);
}

/**
 * Slug çözümleme — eski format: { matches: [...], auto_selected }
 * Şimdilik boş dönüyor çünkü yeni DB'de slug yapısı farklı
 */
function legacy_autodata_resolve_slug(): void {
    jsonResponse(['matches' => [], 'auto_selected' => null]);
}

/**
 * Slug'dan manufacturer bul
 */
function resolve_manufacturer_by_slug(string $slug): ?array {
    // Slug'ı oluştur ve karşılaştır
    $manufacturers = CatalogDB::fetchAll("SELECT id, name FROM manufacturers");

    foreach ($manufacturers as $m) {
        $mSlug = strtolower(trim($m['name']));
        $mSlug = preg_replace('/[^a-z0-9]+/', '-', $mSlug);
        $mSlug = trim($mSlug, '-');
        if ($mSlug === $slug) {
            return $m;
        }
    }

    return null;
}
