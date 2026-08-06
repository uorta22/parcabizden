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

    // Politika auth.php'deki kayit/sifirlama ile ayni olmali — aksi halde
    // kullanici guclu sifreyle kayit olup buradan zayif sifreye dusebiliyordu.
    if (strlen($newPassword) < 8 || !preg_match('/[A-Z]/', $newPassword)
        || !preg_match('/[a-z]/', $newPassword) || !preg_match('/[0-9]/', $newPassword)) {
        jsonResponse(['error' => 'Sifre en az 8 karakter, 1 buyuk harf, 1 kucuk harf ve 1 rakam icermeli'], 400);
    }

    // Get current password hash
    $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = :id');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
        jsonResponse(['error' => 'Mevcut sifre yanlis'], 400);
    }

    // Update password
    // auth.php ile ayni maliyet — PASSWORD_DEFAULT (cost 10) daha zayifti.
    $newHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
    $stmt = $db->prepare('UPDATE users SET password_hash = :pw WHERE id = :id');
    $stmt->execute([':pw' => $newHash, ':id' => $userId]);

    jsonResponse(['success' => true, 'message' => 'Sifreniz basariyla degistirildi']);
}

function handleDeleteAccount($db, $userId) {
    $password = $_POST['password'] ?? '';

    if (!$password) {
        jsonResponse(['error' => 'Hesap silmek icin sifre gereklidir'], 400);
    }

    // Verify password
    $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = :id');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'])) {
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
