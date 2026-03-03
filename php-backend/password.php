<?php
/**
 * ParcaBizden — Password & Account Actions
 * Include from main index.php action router.
 */

function handleChangePassword($db, $userId) {
    $currentPassword = $_POST['current_password'] ?? '';
    $newPassword = $_POST['new_password'] ?? '';

    if (!$currentPassword || !$newPassword) {
        jsonResponse(['error' => 'Mevcut ve yeni sifre gereklidir'], 400);
    }

    if (strlen($newPassword) < 6) {
        jsonResponse(['error' => 'Yeni sifre en az 6 karakter olmalidir'], 400);
    }

    // Get current password hash
    $stmt = $db->prepare('SELECT password FROM users WHERE id = :id');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($currentPassword, $user['password'])) {
        jsonResponse(['error' => 'Mevcut sifre yanlis'], 400);
    }

    // Update password
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $db->prepare('UPDATE users SET password = :pw WHERE id = :id');
    $stmt->execute([':pw' => $newHash, ':id' => $userId]);

    jsonResponse(['success' => true, 'message' => 'Sifreniz basariyla degistirildi']);
}

function handleDeleteAccount($db, $userId) {
    $password = $_POST['password'] ?? '';

    if (!$password) {
        jsonResponse(['error' => 'Hesap silmek icin sifre gereklidir'], 400);
    }

    // Verify password
    $stmt = $db->prepare('SELECT password FROM users WHERE id = :id');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password'])) {
        jsonResponse(['error' => 'Sifre yanlis'], 400);
    }

    // Soft delete: set deleted_at timestamp
    $stmt = $db->prepare('UPDATE users SET deleted_at = NOW() WHERE id = :id');
    $stmt->execute([':id' => $userId]);

    // Clean up user data
    $db->prepare('DELETE FROM favorites WHERE user_id = :uid')->execute([':uid' => $userId]);
    $db->prepare('DELETE FROM addresses WHERE user_id = :uid')->execute([':uid' => $userId]);

    jsonResponse(['success' => true]);
}
