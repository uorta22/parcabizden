<?php
/**
 * ParcaBizden — Extended Profile Actions
 * Include from main index.php action router.
 */

function handleProfileUpdate($db, $userId) {
    $fields = [];
    $params = [':id' => $userId];

    $allowedFields = ['name', 'phone', 'gsm', 'address_line1', 'address_line2', 'city', 'district', 'postal_code'];

    foreach ($allowedFields as $field) {
        if (isset($_POST[$field])) {
            $fields[] = "$field = :$field";
            $params[":$field"] = trim($_POST[$field]);
        }
    }

    if (count($fields) === 0) {
        jsonResponse(['error' => 'Guncellenecek alan bulunamadi'], 400);
    }

    $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
    $db->prepare($sql)->execute($params);

    // Return updated profile
    $stmt = $db->prepare('SELECT id, email, name, phone, gsm, address_line1, address_line2, city, district, postal_code, tc_no FROM users WHERE id = :id');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'phone' => $user['phone'],
            'gsm' => $user['gsm'],
            'address_line1' => $user['address_line1'],
            'address_line2' => $user['address_line2'],
            'city' => $user['city'],
            'district' => $user['district'],
            'postal_code' => $user['postal_code'],
            'tc_no' => $user['tc_no'],
        ],
    ]);
}

/**
 * Enhanced profile action — returns extended user fields.
 * Replace or extend the existing "profile" action handler.
 */
function handleProfileGet($db, $userId) {
    $stmt = $db->prepare('SELECT id, email, name, phone, gsm, address_line1, address_line2, city, district, postal_code, tc_no, is_admin FROM users WHERE id = :id');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        jsonResponse(['error' => 'Kullanici bulunamadi'], 404);
    }

    jsonResponse([
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'phone' => $user['phone'],
            'gsm' => $user['gsm'],
            'address_line1' => $user['address_line1'],
            'address_line2' => $user['address_line2'],
            'city' => $user['city'],
            'district' => $user['district'],
            'postal_code' => $user['postal_code'],
            'tc_no' => $user['tc_no'],
            'is_admin' => (bool)($user['is_admin'] ?? false),
        ],
    ]);
}
