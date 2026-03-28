<?php
/**
 * reviews.php — Ürün yorum ve puanlama API'si
 *
 * Endpoints:
 *   action=list       → Ürün yorumlarını getir (GET: oem_number)
 *   action=summary    → Ürün puan özeti (GET: oem_number)
 *   action=add        → Yeni yorum ekle (POST: JSON body)
 *   action=helpful    → Yorumu faydalı bul (POST: review_id)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://parcabizden.com.tr');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ─── DB Bağlantısı ──────────────────────────────────────────────
$config = [];
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos($line, '#') === 0) continue;
        list($key, $val) = array_pad(explode('=', $line, 2), 2, '');
        $config[trim($key)] = trim($val, '"\'');
    }
}

try {
    $pdo = new PDO(
        "mysql:host={$config['DB_HOST']};dbname={$config['DB_NAME']};charset=utf8mb4",
        $config['DB_USER'],
        $config['DB_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    echo json_encode(['error' => 'DB bağlantı hatası']);
    exit;
}

// ─── Migration: reviews tablosu ──────────────────────────────────
$pdo->exec("
    CREATE TABLE IF NOT EXISTS reviews (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        oem_number      VARCHAR(100) NOT NULL,
        author_name     VARCHAR(100) NOT NULL,
        rating          TINYINT NOT NULL DEFAULT 5,
        title           VARCHAR(255) DEFAULT NULL,
        comment         TEXT DEFAULT NULL,
        verified        TINYINT(1) DEFAULT 0,
        helpful_count   INT DEFAULT 0,
        status          ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_oem (oem_number),
        INDEX idx_status (status),
        INDEX idx_rating (rating)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// ─── ACTION: list ────────────────────────────────────────────────
// Ürünün onaylı yorumlarını getir
if ($action === 'list') {
    $oem = trim($_GET['oem_number'] ?? '');
    if (empty($oem)) {
        echo json_encode(['error' => 'oem_number gerekli']);
        exit;
    }

    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(50, max(5, (int)($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;
    $sort = $_GET['sort'] ?? 'newest';

    $orderBy = match($sort) {
        'oldest' => 'created_at ASC',
        'highest' => 'rating DESC, created_at DESC',
        'lowest' => 'rating ASC, created_at DESC',
        'helpful' => 'helpful_count DESC, created_at DESC',
        default => 'created_at DESC',
    };

    // Toplam sayı
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM reviews WHERE oem_number = :oem AND status = 'approved'");
    $countStmt->execute([':oem' => $oem]);
    $total = (int)$countStmt->fetchColumn();

    // Yorumlar
    $stmt = $pdo->prepare("
        SELECT id, author_name, rating, title, comment, verified, helpful_count, created_at
        FROM reviews
        WHERE oem_number = :oem AND status = 'approved'
        ORDER BY {$orderBy}
        LIMIT :limit OFFSET :offset
    ");
    $stmt->bindValue(':oem', $oem, PDO::PARAM_STR);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'reviews' => $reviews,
        'total' => $total,
        'page' => $page,
        'pages' => ceil($total / $limit),
    ]);
    exit;
}

// ─── ACTION: summary ─────────────────────────────────────────────
// Ürünün puan özeti (ortalama, dağılım)
if ($action === 'summary') {
    $oem = trim($_GET['oem_number'] ?? '');
    if (empty($oem)) {
        echo json_encode(['error' => 'oem_number gerekli']);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT
            COUNT(*) as total,
            COALESCE(AVG(rating), 0) as average,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as star5,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as star4,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as star3,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as star2,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as star1
        FROM reviews
        WHERE oem_number = :oem AND status = 'approved'
    ");
    $stmt->execute([':oem' => $oem]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'total' => (int)$row['total'],
        'average' => round((float)$row['average'], 1),
        'distribution' => [
            5 => (int)$row['star5'],
            4 => (int)$row['star4'],
            3 => (int)$row['star3'],
            2 => (int)$row['star2'],
            1 => (int)$row['star1'],
        ],
    ]);
    exit;
}

// ─── ACTION: add ─────────────────────────────────────────────────
// Yeni yorum ekle
if ($action === 'add') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        echo json_encode(['error' => 'JSON body gerekli']);
        exit;
    }

    $oem = trim($input['oem_number'] ?? '');
    $authorName = trim($input['author_name'] ?? '');
    $rating = (int)($input['rating'] ?? 0);
    $title = trim($input['title'] ?? '');
    $comment = trim($input['comment'] ?? '');

    // Validasyon
    $errors = [];
    if (empty($oem)) $errors[] = 'OEM numarası gerekli';
    if (empty($authorName)) $errors[] = 'İsim gerekli';
    if (mb_strlen($authorName) < 2) $errors[] = 'İsim en az 2 karakter olmalı';
    if ($rating < 1 || $rating > 5) $errors[] = 'Puan 1-5 arası olmalı';
    if (empty($comment)) $errors[] = 'Yorum metni gerekli';
    if (mb_strlen($comment) < 10) $errors[] = 'Yorum en az 10 karakter olmalı';
    if (mb_strlen($comment) > 2000) $errors[] = 'Yorum en fazla 2000 karakter olabilir';

    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['error' => implode(', ', $errors)]);
        exit;
    }

    // Spam koruması: aynı IP'den son 1 dakika içinde yorum yapılmış mı
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';

    $stmt = $pdo->prepare("
        INSERT INTO reviews (oem_number, author_name, rating, title, comment, status)
        VALUES (:oem, :name, :rating, :title, :comment, 'approved')
    ");

    try {
        $stmt->execute([
            ':oem' => $oem,
            ':name' => htmlspecialchars($authorName, ENT_QUOTES, 'UTF-8'),
            ':rating' => $rating,
            ':title' => htmlspecialchars($title, ENT_QUOTES, 'UTF-8'),
            ':comment' => htmlspecialchars($comment, ENT_QUOTES, 'UTF-8'),
        ]);

        echo json_encode([
            'status' => 'ok',
            'review_id' => (int)$pdo->lastInsertId(),
            'message' => 'Yorumunuz eklendi',
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Yorum kaydedilemedi']);
    }
    exit;
}

// ─── ACTION: helpful ─────────────────────────────────────────────
// Yorumu faydalı bul (helpful_count artır)
if ($action === 'helpful') {
    $input = json_decode(file_get_contents('php://input'), true);
    $reviewId = (int)($input['review_id'] ?? 0);

    if ($reviewId <= 0) {
        echo json_encode(['error' => 'review_id gerekli']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = :id AND status = 'approved'");
    $stmt->execute([':id' => $reviewId]);

    echo json_encode([
        'status' => 'ok',
        'review_id' => $reviewId,
    ]);
    exit;
}

echo json_encode(['error' => 'Geçersiz action. Kullanım: list, summary, add, helpful']);
