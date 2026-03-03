<?php
/**
 * ParcaBizden — Address Actions
 * Include from main index.php action router.
 */

function handleAddressList($db, $userId) {
    $stmt = $db->prepare('SELECT * FROM addresses WHERE user_id = :uid ORDER BY is_default DESC, created_at DESC');
    $stmt->execute([':uid' => $userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(['addresses' => array_map('formatAddress', $rows)]);
}

function handleAddressAdd($db, $userId) {
    $title = trim($_POST['title'] ?? '');
    $fullName = trim($_POST['full_name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $line1 = trim($_POST['address_line1'] ?? '');
    $line2 = trim($_POST['address_line2'] ?? '');
    $city = trim($_POST['city'] ?? '');
    $district = trim($_POST['district'] ?? '');
    $postalCode = trim($_POST['postal_code'] ?? '');
    $isDefault = intval($_POST['is_default'] ?? 0);

    if (!$title || !$fullName || !$phone || !$line1 || !$city || !$district || !$postalCode) {
        jsonResponse(['error' => 'Tum zorunlu alanlar doldurulmalidir'], 400);
    }

    $db->beginTransaction();
    try {
        // If setting as default, unset others
        if ($isDefault) {
            $db->prepare('UPDATE addresses SET is_default = 0 WHERE user_id = :uid')->execute([':uid' => $userId]);
        }

        $stmt = $db->prepare('INSERT INTO addresses (user_id, title, full_name, phone, address_line1, address_line2, city, district, postal_code, is_default) VALUES (:uid, :title, :fn, :phone, :l1, :l2, :city, :dist, :pc, :def)');
        $stmt->execute([
            ':uid' => $userId,
            ':title' => $title,
            ':fn' => $fullName,
            ':phone' => $phone,
            ':l1' => $line1,
            ':l2' => $line2 ?: null,
            ':city' => $city,
            ':dist' => $district,
            ':pc' => $postalCode,
            ':def' => $isDefault ? 1 : 0,
        ]);

        $id = (int)$db->lastInsertId();
        $db->commit();

        $stmt = $db->prepare('SELECT * FROM addresses WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        jsonResponse(['address' => formatAddress($row)]);
    } catch (Exception $e) {
        $db->rollBack();
        jsonResponse(['error' => 'Adres eklenemedi'], 500);
    }
}

function handleAddressUpdate($db, $userId) {
    $id = intval($_POST['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'id gerekli'], 400);

    // Verify ownership
    $stmt = $db->prepare('SELECT * FROM addresses WHERE id = :id AND user_id = :uid');
    $stmt->execute([':id' => $id, ':uid' => $userId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$existing) jsonResponse(['error' => 'Adres bulunamadi'], 404);

    $fields = [];
    $params = [':id' => $id];

    foreach (['title', 'full_name', 'phone', 'address_line1', 'address_line2', 'city', 'district', 'postal_code'] as $field) {
        if (isset($_POST[$field])) {
            $fields[] = "$field = :$field";
            $params[":$field"] = trim($_POST[$field]);
        }
    }

    if (isset($_POST['is_default'])) {
        $isDefault = intval($_POST['is_default']);
        if ($isDefault) {
            $db->prepare('UPDATE addresses SET is_default = 0 WHERE user_id = :uid')->execute([':uid' => $userId]);
        }
        $fields[] = 'is_default = :is_default';
        $params[':is_default'] = $isDefault;
    }

    if (count($fields) > 0) {
        $sql = 'UPDATE addresses SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $db->prepare($sql)->execute($params);
    }

    $stmt = $db->prepare('SELECT * FROM addresses WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    jsonResponse(['address' => formatAddress($row)]);
}

function handleAddressRemove($db, $userId) {
    $id = intval($_POST['id'] ?? 0);
    if (!$id) jsonResponse(['error' => 'id gerekli'], 400);

    $stmt = $db->prepare('DELETE FROM addresses WHERE id = :id AND user_id = :uid');
    $stmt->execute([':id' => $id, ':uid' => $userId]);

    jsonResponse(['success' => true]);
}

function formatAddress($row) {
    return [
        'id' => (int)$row['id'],
        'title' => $row['title'],
        'full_name' => $row['full_name'],
        'phone' => $row['phone'],
        'address_line1' => $row['address_line1'],
        'address_line2' => $row['address_line2'],
        'city' => $row['city'],
        'district' => $row['district'],
        'postal_code' => $row['postal_code'],
        'is_default' => (bool)$row['is_default'],
    ];
}
