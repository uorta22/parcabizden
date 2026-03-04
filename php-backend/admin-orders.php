<?php
/**
 * ParcaBizden — Admin Order Actions
 * Include from main index.php action router.
 * Requires authenticated admin user.
 */

function handleAdminOrderList($db, $userId) {
    requireAdmin($db, $userId);

    $page = max(1, intval($_POST['page'] ?? 1));
    $perPage = 20;
    $offset = ($page - 1) * $perPage;
    $status = trim($_POST['status'] ?? '');

    $where = '1=1';
    $params = [];

    if ($status) {
        $where .= ' AND o.status = :status';
        $params[':status'] = $status;
    }

    // Count
    $countSql = "SELECT COUNT(*) FROM orders o WHERE $where";
    $stmt = $db->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    // Fetch orders
    $sql = "SELECT o.*, u.name AS user_name, u.email AS user_email FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE $where ORDER BY o.created_at DESC LIMIT :limit OFFSET :offset";
    $stmt = $db->prepare($sql);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $orders = [];
    foreach ($rows as $row) {
        // Fetch items
        $itemStmt = $db->prepare('SELECT * FROM order_items WHERE order_id = :oid');
        $itemStmt->execute([':oid' => $row['id']]);
        $row['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

        $formatted = formatOrder($row);
        // Add customer info for admin
        $formatted['customer_name'] = $row['user_name'] ?? '';
        $formatted['customer_email'] = $row['user_email'] ?? '';
        $orders[] = $formatted;
    }

    jsonResponse([
        'orders' => $orders,
        'total' => $total,
        'page' => $page,
        'per_page' => $perPage,
    ]);
}

function handleAdminOrderUpdateStatus($db, $userId) {
    requireAdmin($db, $userId);

    $id = intval($_POST['id'] ?? 0);
    $status = trim($_POST['status'] ?? '');

    if (!$id || !$status) {
        jsonResponse(['error' => 'id ve status zorunlu'], 400);
    }

    $validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!in_array($status, $validStatuses)) {
        jsonResponse(['error' => 'Gecersiz durum'], 400);
    }

    $stmt = $db->prepare('UPDATE orders SET status = :status WHERE id = :id');
    $stmt->execute([':status' => $status, ':id' => $id]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['error' => 'Siparis bulunamadi'], 404);
    }

    admin_audit_log($db, $userId, 'order_status_update', $id, json_encode(['new_status' => $status]));

    jsonResponse(['success' => true]);
}
