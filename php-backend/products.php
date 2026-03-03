<?php
/**
 * ParcaBizden — Product Actions
 * Include from main index.php action router.
 */

function handleProductList($db) {
    $category = trim($_POST['category'] ?? '');
    $search = trim($_POST['search'] ?? '');
    $brand = trim($_POST['brand'] ?? '');
    $vehicleId = intval($_POST['vehicle_id'] ?? 0);
    $page = max(1, intval($_POST['page'] ?? 1));
    $perPage = max(1, min(100, intval($_POST['per_page'] ?? 20)));
    $offset = ($page - 1) * $perPage;

    $where = ['1=1'];
    $params = [];

    if ($category) {
        $where[] = 'p.category = :category';
        $params[':category'] = $category;
    }

    if ($search) {
        $where[] = '(p.name LIKE :search OR p.oem_number LIKE :search2 OR p.description LIKE :search3 OR p.brand_name LIKE :search4)';
        $searchTerm = '%' . $search . '%';
        $params[':search'] = $searchTerm;
        $params[':search2'] = $searchTerm;
        $params[':search3'] = $searchTerm;
        $params[':search4'] = $searchTerm;
    }

    if ($brand) {
        $where[] = 'JSON_SEARCH(p.compatible_vehicles, "one", :brand, NULL, "$[*].brand_slug") IS NOT NULL';
        $params[':brand'] = $brand;
    }

    $joinClause = '';
    if ($vehicleId > 0) {
        $joinClause = 'INNER JOIN vehicle_products vp ON vp.product_id = p.id AND vp.vehicle_id = :vehicle_id';
        $params[':vehicle_id'] = $vehicleId;
    }

    $whereStr = implode(' AND ', $where);

    // Count
    $countSql = "SELECT COUNT(*) as total FROM products p {$joinClause} WHERE {$whereStr}";
    $stmt = $db->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    // Fetch
    $sql = "SELECT p.* FROM products p {$joinClause} WHERE {$whereStr} ORDER BY p.created_at DESC LIMIT :limit OFFSET :offset";
    $stmt = $db->prepare($sql);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $products = array_map('formatProduct', $rows);

    jsonResponse([
        'products' => $products,
        'total' => $total,
        'page' => $page,
        'per_page' => $perPage,
    ]);
}

function handleProductDetail($db) {
    $slug = trim($_POST['slug'] ?? '');
    if (!$slug) {
        jsonResponse(['error' => 'slug gerekli'], 400);
    }

    $stmt = $db->prepare('SELECT * FROM products WHERE slug = :slug LIMIT 1');
    $stmt->execute([':slug' => $slug]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        jsonResponse(['error' => 'Urun bulunamadi'], 404);
    }

    jsonResponse(['product' => formatProduct($row)]);
}

function handleProductSearch($db) {
    $q = trim($_POST['q'] ?? '');
    if (!$q) {
        jsonResponse(['products' => []]);
    }

    $searchTerm = '%' . $q . '%';
    $stmt = $db->prepare('SELECT * FROM products WHERE name LIKE :q1 OR oem_number LIKE :q2 OR description LIKE :q3 OR brand_name LIKE :q4 ORDER BY created_at DESC LIMIT 50');
    $stmt->execute([':q1' => $searchTerm, ':q2' => $searchTerm, ':q3' => $searchTerm, ':q4' => $searchTerm]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(['products' => array_map('formatProduct', $rows)]);
}

function formatProduct($row) {
    return [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'slug' => $row['slug'],
        'oem_number' => $row['oem_number'],
        'brand_name' => $row['brand_name'],
        'brand_logo' => $row['brand_logo'],
        'category' => $row['category'],
        'price' => $row['price'] !== null ? (float)$row['price'] : null,
        'discount_price' => $row['discount_price'] !== null ? (float)$row['discount_price'] : null,
        'images' => json_decode($row['images'] ?? '[]', true) ?: [],
        'thumbnail' => $row['thumbnail'],
        'specs' => json_decode($row['specs'] ?? '{}', true) ?: (object)[],
        'description' => $row['description'] ?? '',
        'compatible_vehicles' => json_decode($row['compatible_vehicles'] ?? '[]', true) ?: [],
        'in_stock' => (bool)$row['in_stock'],
        'is_consumable' => (bool)$row['is_consumable'],
        'tags' => json_decode($row['tags'] ?? '[]', true) ?: [],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}
