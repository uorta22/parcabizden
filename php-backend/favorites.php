<?php
/**
 * ParcaBizden — Favorite Actions
 * Include from main index.php action router.
 */

function handleFavoriteList($db, $userId) {
    $stmt = $db->prepare('
        SELECT f.id, f.product_id, f.added_at, p.*
        FROM favorites f
        LEFT JOIN products p ON p.id = f.product_id
        WHERE f.user_id = :uid
        ORDER BY f.added_at DESC
    ');
    $stmt->execute([':uid' => $userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $favorites = [];
    $products = [];

    foreach ($rows as $row) {
        $favorites[] = [
            'id' => (int)$row['id'],
            'product_id' => (string)$row['product_id'],
            'added_at' => $row['added_at'],
        ];

        if ($row['name']) { // product exists
            $products[] = formatProduct($row);
        }
    }

    jsonResponse(['favorites' => $favorites, 'products' => $products]);
}

function handleFavoriteAdd($db, $userId) {
    $productId = intval($_POST['product_id'] ?? 0);
    if (!$productId) jsonResponse(['error' => 'product_id gerekli'], 400);

    // Check product exists
    $stmt = $db->prepare('SELECT id FROM products WHERE id = :pid');
    $stmt->execute([':pid' => $productId]);
    if (!$stmt->fetch()) {
        jsonResponse(['error' => 'Urun bulunamadi'], 404);
    }

    // Insert ignore duplicate
    $stmt = $db->prepare('INSERT IGNORE INTO favorites (user_id, product_id) VALUES (:uid, :pid)');
    $stmt->execute([':uid' => $userId, ':pid' => $productId]);

    jsonResponse(['success' => true]);
}

function handleFavoriteRemove($db, $userId) {
    $productId = intval($_POST['product_id'] ?? 0);
    if (!$productId) jsonResponse(['error' => 'product_id gerekli'], 400);

    $stmt = $db->prepare('DELETE FROM favorites WHERE user_id = :uid AND product_id = :pid');
    $stmt->execute([':uid' => $userId, ':pid' => $productId]);

    jsonResponse(['success' => true]);
}
