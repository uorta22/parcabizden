<?php
/**
 * ParcaBizden — Order Actions
 * Include from main index.php action router.
 */

function handleOrderList($db, $userId) {
    $stmt = $db->prepare('SELECT * FROM orders WHERE user_id = :uid ORDER BY created_at DESC');
    $stmt->execute([':uid' => $userId]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($orders as &$order) {
        $itemStmt = $db->prepare('SELECT * FROM order_items WHERE order_id = :oid');
        $itemStmt->execute([':oid' => $order['id']]);
        $order['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
        $order = formatOrder($order);
    }

    jsonResponse(['orders' => $orders]);
}

function handleOrderDetail($db, $userId) {
    $id = intval($_POST['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'id gerekli'], 400);

    $stmt = $db->prepare('SELECT * FROM orders WHERE id = :id AND user_id = :uid LIMIT 1');
    $stmt->execute([':id' => $id, ':uid' => $userId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) jsonResponse(['error' => 'Siparis bulunamadi'], 404);

    $itemStmt = $db->prepare('SELECT * FROM order_items WHERE order_id = :oid');
    $itemStmt->execute([':oid' => $order['id']]);
    $order['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get address if exists
    if ($order['address_id']) {
        $addrStmt = $db->prepare('SELECT * FROM addresses WHERE id = :aid LIMIT 1');
        $addrStmt->execute([':aid' => $order['address_id']]);
        $order['address'] = $addrStmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    jsonResponse(['order' => formatOrder($order)]);
}

function handleOrderCreate($db, $userId) {
    $itemsJson = $_POST['items'] ?? '';
    $addressId = intval($_POST['address_id'] ?? 0);
    $notes = trim($_POST['notes'] ?? '');

    $items = json_decode($itemsJson, true);
    if (!$items || !is_array($items) || count($items) === 0) {
        jsonResponse(['error' => 'Sepet bos'], 400);
    }

    if (!$addressId) {
        jsonResponse(['error' => 'Adres secimi gerekli'], 400);
    }

    // Verify address belongs to user
    $addrStmt = $db->prepare('SELECT id FROM addresses WHERE id = :aid AND user_id = :uid');
    $addrStmt->execute([':aid' => $addressId, ':uid' => $userId]);
    if (!$addrStmt->fetch()) {
        jsonResponse(['error' => 'Gecersiz adres'], 400);
    }

    // Generate order number: PB-YYYYMMDD-XXXX
    $orderNo = 'PB-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));

    // Calculate total
    $totalPrice = 0;
    foreach ($items as $item) {
        if (!empty($item['has_price'])) {
            $totalPrice += floatval($item['unit_price']) * intval($item['quantity']);
        }
    }

    $db->beginTransaction();
    try {
        $stmt = $db->prepare('INSERT INTO orders (user_id, order_no, status, total_price, address_id, notes) VALUES (:uid, :ono, :status, :total, :aid, :notes)');
        $stmt->execute([
            ':uid' => $userId,
            ':ono' => $orderNo,
            ':status' => 'pending',
            ':total' => $totalPrice,
            ':aid' => $addressId,
            ':notes' => $notes ?: null,
        ]);
        $orderId = (int)$db->lastInsertId();

        $itemStmt = $db->prepare('INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, unit_price, has_price) VALUES (:oid, :pid, :pname, :pimg, :qty, :price, :hp)');

        foreach ($items as $item) {
            $productId = intval($item['product_id'] ?? 0);
            $productName = '';

            // Lookup product name from DB
            if ($productId) {
                $pStmt = $db->prepare('SELECT name, thumbnail FROM products WHERE id = :pid LIMIT 1');
                $pStmt->execute([':pid' => $productId]);
                $product = $pStmt->fetch(PDO::FETCH_ASSOC);
                if ($product) {
                    $productName = $product['name'];
                }
            }

            $itemStmt->execute([
                ':oid' => $orderId,
                ':pid' => $productId ?: null,
                ':pname' => $productName ?: ('Urun #' . $productId),
                ':pimg' => $product['thumbnail'] ?? null,
                ':qty' => max(1, intval($item['quantity'])),
                ':price' => floatval($item['unit_price'] ?? 0),
                ':hp' => !empty($item['has_price']) ? 1 : 0,
            ]);
        }

        $db->commit();

        // Fetch created order
        $stmt = $db->prepare('SELECT * FROM orders WHERE id = :id');
        $stmt->execute([':id' => $orderId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        $iStmt = $db->prepare('SELECT * FROM order_items WHERE order_id = :oid');
        $iStmt->execute([':oid' => $orderId]);
        $order['items'] = $iStmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(['order' => formatOrder($order)]);
    } catch (Exception $e) {
        $db->rollBack();
        jsonResponse(['error' => 'Siparis olusturulamadi: ' . $e->getMessage()], 500);
    }
}

function formatOrder($row) {
    $items = [];
    if (isset($row['items'])) {
        foreach ($row['items'] as $item) {
            $items[] = [
                'product_id' => (string)$item['product_id'],
                'product_name' => $item['product_name'],
                'product_image' => $item['product_image'],
                'quantity' => (int)$item['quantity'],
                'unit_price' => (float)$item['unit_price'],
                'has_price' => (bool)$item['has_price'],
            ];
        }
    }

    return [
        'id' => (int)$row['id'],
        'order_no' => $row['order_no'],
        'status' => $row['status'],
        'items' => $items,
        'total_price' => (float)$row['total_price'],
        'address' => $row['address'] ?? null,
        'notes' => $row['notes'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}
