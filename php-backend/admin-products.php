<?php
/**
 * ParcaBizden — Admin Product Actions
 * Include from main index.php action router.
 * Requires authenticated admin user ($userId + is_admin check).
 */

function handleAdminProductAdd($db, $userId) {


    $name = trim($_POST['name'] ?? '');
    $slug = trim($_POST['slug'] ?? '');
    $category = trim($_POST['category'] ?? '');

    if (!$name || !$slug || !$category) {
        jsonResponse(['error' => 'name, slug ve category zorunlu'], 400);
    }

    // Check slug uniqueness
    $stmt = $db->prepare('SELECT id FROM products WHERE slug = :slug');
    $stmt->execute([':slug' => $slug]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Bu slug zaten kullanılıyor'], 400);
    }

    $price = trim($_POST['price'] ?? '');
    $discountPrice = trim($_POST['discount_price'] ?? '');

    $stmt = $db->prepare('INSERT INTO products (name, slug, oem_number, brand_name, brand_logo, category, price, discount_price, images, thumbnail, specs, description, compatible_vehicles, in_stock, is_consumable, tags) VALUES (:name, :slug, :oem, :brand, :logo, :cat, :price, :dprice, :images, :thumb, :specs, :desc, :vehicles, :stock, :consumable, :tags)');
    $stmt->execute([
        ':name' => $name,
        ':slug' => $slug,
        ':oem' => trim($_POST['oem_number'] ?? '') ?: null,
        ':brand' => trim($_POST['brand_name'] ?? '') ?: null,
        ':logo' => trim($_POST['brand_logo'] ?? '') ?: null,
        ':cat' => $category,
        ':price' => $price !== '' ? (float)$price : null,
        ':dprice' => $discountPrice !== '' ? (float)$discountPrice : null,
        ':images' => $_POST['images'] ?? '[]',
        ':thumb' => trim($_POST['thumbnail'] ?? '') ?: null,
        ':specs' => $_POST['specs'] ?? '{}',
        ':desc' => trim($_POST['description'] ?? '') ?: null,
        ':vehicles' => $_POST['compatible_vehicles'] ?? '[]',
        ':stock' => ($_POST['in_stock'] ?? '1') === '1' ? 1 : 0,
        ':consumable' => ($_POST['is_consumable'] ?? '0') === '1' ? 1 : 0,
        ':tags' => $_POST['tags'] ?? '[]',
    ]);

    $productId = (int)$db->lastInsertId();

    admin_audit_log($db, $userId, 'product_add', $productId, json_encode(['name' => $name, 'slug' => $slug]));

    $stmt = $db->prepare('SELECT * FROM products WHERE id = :id');
    $stmt->execute([':id' => $productId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    jsonResponse(['product' => formatProduct($row)]);
}

function handleAdminProductUpdate($db, $userId) {


    $id = intval($_POST['id'] ?? 0);
    if (!$id) {
        jsonResponse(['error' => 'id zorunlu'], 400);
    }

    // Check product exists
    $stmt = $db->prepare('SELECT id FROM products WHERE id = :id');
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetch()) {
        jsonResponse(['error' => 'Urun bulunamadi'], 404);
    }

    $fields = [];
    $params = [':id' => $id];

    $allowedFields = ['name', 'slug', 'oem_number', 'brand_name', 'brand_logo', 'category', 'description', 'thumbnail'];

    foreach ($allowedFields as $field) {
        if (isset($_POST[$field])) {
            $val = trim($_POST[$field]);
            $fields[] = "$field = :$field";
            $params[":$field"] = $val !== '' ? $val : null;
        }
    }

    // Numeric fields
    if (isset($_POST['price'])) {
        $fields[] = 'price = :price';
        $params[':price'] = trim($_POST['price']) !== '' ? (float)$_POST['price'] : null;
    }
    if (isset($_POST['discount_price'])) {
        $fields[] = 'discount_price = :dprice';
        $params[':dprice'] = trim($_POST['discount_price']) !== '' ? (float)$_POST['discount_price'] : null;
    }

    // Boolean fields
    if (isset($_POST['in_stock'])) {
        $fields[] = 'in_stock = :stock';
        $params[':stock'] = $_POST['in_stock'] === '1' ? 1 : 0;
    }
    if (isset($_POST['is_consumable'])) {
        $fields[] = 'is_consumable = :consumable';
        $params[':consumable'] = $_POST['is_consumable'] === '1' ? 1 : 0;
    }

    // JSON fields
    if (isset($_POST['images'])) {
        $fields[] = 'images = :images';
        $params[':images'] = $_POST['images'];
    }
    if (isset($_POST['specs'])) {
        $fields[] = 'specs = :specs';
        $params[':specs'] = $_POST['specs'];
    }
    if (isset($_POST['compatible_vehicles'])) {
        $fields[] = 'compatible_vehicles = :vehicles';
        $params[':vehicles'] = $_POST['compatible_vehicles'];
    }
    if (isset($_POST['tags'])) {
        $fields[] = 'tags = :tags';
        $params[':tags'] = $_POST['tags'];
    }

    if (count($fields) === 0) {
        jsonResponse(['error' => 'Guncellenecek alan yok'], 400);
    }

    // Check slug uniqueness if slug is being updated
    if (isset($params[':slug'])) {
        $stmt = $db->prepare('SELECT id FROM products WHERE slug = :slug AND id != :check_id');
        $stmt->execute([':slug' => $params[':slug'], ':check_id' => $id]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Bu slug zaten kullanılıyor'], 400);
        }
    }

    $sql = 'UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = :id';
    $db->prepare($sql)->execute($params);

    admin_audit_log($db, $userId, 'product_update', $id, json_encode(array_keys($fields)));

    $stmt = $db->prepare('SELECT * FROM products WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    jsonResponse(['product' => formatProduct($row)]);
}

function handleAdminEnrichPart($db, $userId) {


    $oemNumber = trim($_POST['oem_number'] ?? '');
    if (!$oemNumber) {
        jsonResponse(['error' => 'oem_number zorunlu'], 400);
    }

    // parts tablosunda kontrol et
    $stmt = $db->prepare('SELECT oem_number, MAX(name) as name FROM parts WHERE oem_number = :oem GROUP BY oem_number');
    $stmt->execute([':oem' => $oemNumber]);
    $partRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$partRow) {
        jsonResponse(['error' => 'Bu OEM numarası parts tablosunda bulunamadı'], 404);
    }

    $price = trim($_POST['price'] ?? '');
    $discountPrice = trim($_POST['discount_price'] ?? '');
    $category = trim($_POST['category'] ?? 'other');
    $thumbnail = trim($_POST['thumbnail'] ?? '') ?: null;

    // products tablosunda bu OEM var mı?
    $stmt = $db->prepare('SELECT id FROM products WHERE oem_number = :oem');
    $stmt->execute([':oem' => $oemNumber]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // UPDATE
        $fields = [];
        $params = [':id' => (int)$existing['id']];

        if ($price !== '') { $fields[] = 'price = :price'; $params[':price'] = (float)$price; }
        if ($discountPrice !== '') { $fields[] = 'discount_price = :dprice'; $params[':dprice'] = (float)$discountPrice; }
        if ($thumbnail) { $fields[] = 'thumbnail = :thumb'; $params[':thumb'] = $thumbnail; }
        if (isset($_POST['category'])) { $fields[] = 'category = :cat'; $params[':cat'] = $category; }
        if (isset($_POST['in_stock'])) { $fields[] = 'in_stock = :stock'; $params[':stock'] = $_POST['in_stock'] === '1' ? 1 : 0; }

        if (count($fields) > 0) {
            $sql = 'UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = :id';
            $db->prepare($sql)->execute($params);
        }

        admin_audit_log($db, $userId, 'enrich_part_update', (int)$existing['id'], json_encode(['oem' => $oemNumber]));

        $stmt = $db->prepare('SELECT * FROM products WHERE id = :id');
        $stmt->execute([':id' => (int)$existing['id']]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        jsonResponse(['product' => formatProduct($row), 'action' => 'updated']);
    }

    // INSERT — otomatik slug ve name
    $name = trim($_POST['name'] ?? '') ?: $partRow['name'];
    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $oemNumber));
    $slug = trim($slug, '-');

    // Slug çakışması kontrolü
    $baseSlug = $slug;
    $counter = 0;
    while (true) {
        $checkSlug = $counter > 0 ? "{$baseSlug}-{$counter}" : $baseSlug;
        $stmt = $db->prepare('SELECT id FROM products WHERE slug = :slug');
        $stmt->execute([':slug' => $checkSlug]);
        if (!$stmt->fetch()) { $slug = $checkSlug; break; }
        $counter++;
    }

    $stmt = $db->prepare('INSERT INTO products (name, slug, oem_number, category, price, discount_price, thumbnail, in_stock, images, specs, compatible_vehicles, tags) VALUES (:name, :slug, :oem, :cat, :price, :dprice, :thumb, :stock, :images, :specs, :vehicles, :tags)');
    $stmt->execute([
        ':name' => $name,
        ':slug' => $slug,
        ':oem' => $oemNumber,
        ':cat' => $category,
        ':price' => $price !== '' ? (float)$price : null,
        ':dprice' => $discountPrice !== '' ? (float)$discountPrice : null,
        ':thumb' => $thumbnail,
        ':stock' => ($_POST['in_stock'] ?? '1') === '1' ? 1 : 0,
        ':images' => '[]',
        ':specs' => '{}',
        ':vehicles' => '[]',
        ':tags' => '[]',
    ]);

    $productId = (int)$db->lastInsertId();
    admin_audit_log($db, $userId, 'enrich_part_add', $productId, json_encode(['oem' => $oemNumber, 'name' => $name]));

    $stmt = $db->prepare('SELECT * FROM products WHERE id = :id');
    $stmt->execute([':id' => $productId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    jsonResponse(['product' => formatProduct($row), 'action' => 'created']);
}

function handleAdminProductDelete($db, $userId) {


    $id = intval($_POST['id'] ?? 0);
    if (!$id) {
        jsonResponse(['error' => 'id zorunlu'], 400);
    }

    $stmt = $db->prepare('DELETE FROM products WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['error' => 'Urun bulunamadi'], 404);
    }

    admin_audit_log($db, $userId, 'product_delete', $id);

    jsonResponse(['success' => true]);
}

function handleAdminSetDefaultThumbnails($db, $userId) {


    $defaultUrl = 'https://parcabizden.com.tr/default-part.jpg';

    $stmt = $db->prepare("UPDATE products SET thumbnail = :url WHERE thumbnail IS NULL OR thumbnail = ''");
    $stmt->execute([':url' => $defaultUrl]);
    $affected = $stmt->rowCount();

    admin_audit_log($db, $userId, 'set_default_thumbnails', 0, json_encode(['affected' => $affected]));

    jsonResponse(['success' => true, 'updated' => $affected]);
}
