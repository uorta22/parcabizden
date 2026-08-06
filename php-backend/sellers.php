<?php
/**
 * sellers.php — Satıcı (mağaza) kaydı, profil ve onay akışı
 *
 * handle_seller_register, handle_seller_me, handle_seller_update,
 * handle_admin_seller_list, handle_admin_seller_decide, handle_admin_seller_document
 *
 * Bağımlılık: auth.php (get_auth_user_id, requireAdmin)
 *             security.php (check_rate_limit, admin_audit_log)
 *             jsonResponse() (natro-index.php'de tanımlı)
 *
 * Şema: migration-marketplace-01-core.sql (sellers, cities, districts)
 *
 * GÜVENLİK NOTU — vergi levhası:
 * Yüklenen belge ticari bilgi içerir ve web kökünden erişilebilir OLMAMALIDIR.
 * Dosyalar tmp/seller-docs/ altına, .htaccess ile kapatılmış bir dizine yazılır
 * ve yalnızca admin tarafından PHP üzerinden okunur (handle_admin_seller_document).
 * Dosya adı istemciden GELMEZ — sunucuda üretilir (path traversal önlemi).
 */

const SELLER_DOC_MAX_BYTES = 5 * 1024 * 1024;   // 5 MB
const SELLER_DOC_TYPES = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png'];

function seller_doc_dir(): string {
    return __DIR__ . '/tmp/seller-docs';
}

/** Türkçe metni URL-güvenli slug'a çevirir. */
function seller_slugify(string $text): string {
    $map = ['ç'=>'c','Ç'=>'c','ğ'=>'g','Ğ'=>'g','ı'=>'i','I'=>'i','İ'=>'i','i'=>'i',
            'ö'=>'o','Ö'=>'o','ş'=>'s','Ş'=>'s','ü'=>'u','Ü'=>'u'];
    $text = strtr($text, $map);
    $text = mb_strtolower($text, 'UTF-8');
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    return trim((string)$text, '-');
}

/** Aynı slug varsa sonuna -2, -3 ekler. */
function seller_unique_slug($pdo, string $base): string {
    $base = $base !== '' ? $base : 'magaza';
    $slug = $base;
    $i = 1;
    $stmt = $pdo->prepare('SELECT 1 FROM sellers WHERE slug = ?');
    while (true) {
        $stmt->execute([$slug]);
        if (!$stmt->fetch()) return $slug;
        $i++;
        $slug = $base . '-' . $i;
        if ($i > 50) return $base . '-' . bin2hex(random_bytes(3));
    }
}

/**
 * Vergi levhasını korumalı dizine yazar, göreli yolu döndürür.
 * MIME tipi uzantıdan değil, dosya içeriğinden doğrulanır.
 */
function seller_store_document(array $file, int $userId): ?string {
    if (!isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) return null;
    if ($file['size'] > SELLER_DOC_MAX_BYTES) {
        jsonResponse(['error' => 'Belge en fazla 5 MB olabilir'], 400);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    if (!isset(SELLER_DOC_TYPES[$mime])) {
        jsonResponse(['error' => 'Belge yalnizca PDF, JPG veya PNG olabilir'], 400);
    }

    $dir = seller_doc_dir();
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        error_log('Satici belge dizini olusturulamadi: ' . $dir);
        jsonResponse(['error' => 'Belge kaydedilemedi'], 500);
    }
    // Dizin web'den okunamasin (Apache/LiteSpeed).
    $ht = $dir . '/.htaccess';
    if (!file_exists($ht)) @file_put_contents($ht, "Deny from all\n");

    // Dosya adi sunucuda uretilir — istemci adi hic kullanilmaz.
    $name = sprintf('%d-%s.%s', $userId, bin2hex(random_bytes(8)), SELLER_DOC_TYPES[$mime]);
    if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $name)) {
        error_log('Satici belgesi tasinamadi: ' . $name);
        jsonResponse(['error' => 'Belge kaydedilemedi'], 500);
    }
    return 'tmp/seller-docs/' . $name;
}

// ==================== Satıcı: kayıt ve profil ====================

function handle_seller_register($pdo, int $userId): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'POST only'], 405);
    if (!check_rate_limit('seller_register', 5, 60)) return;

    // Tek kullanıcı tek mağaza
    $stmt = $pdo->prepare('SELECT id, status FROM sellers WHERE user_id = ?');
    $stmt->execute([$userId]);
    if ($existing = $stmt->fetch(PDO::FETCH_ASSOC)) {
        jsonResponse(['error' => 'Bu hesaba bagli bir magaza zaten var', 'status' => $existing['status']], 409);
    }

    $name       = trim($_POST['name'] ?? '');
    $cityId     = (int)($_POST['city_id'] ?? 0);
    $districtId = isset($_POST['district_id']) && $_POST['district_id'] !== '' ? (int)$_POST['district_id'] : null;
    $address    = trim($_POST['address'] ?? '');
    $whatsapp   = preg_replace('/\D+/', '', $_POST['whatsapp'] ?? '');
    $phone      = preg_replace('/\D+/', '', $_POST['phone'] ?? '');
    $taxNumber  = preg_replace('/\D+/', '', $_POST['tax_number'] ?? '');

    if (mb_strlen($name) < 3)  jsonResponse(['error' => 'Magaza adi en az 3 karakter olmali'], 400);
    if (mb_strlen($name) > 150) jsonResponse(['error' => 'Magaza adi en fazla 150 karakter olabilir'], 400);
    if (!$cityId)              jsonResponse(['error' => 'Il secimi zorunlu'], 400);
    if (strlen($whatsapp) < 10) jsonResponse(['error' => 'Gecerli bir WhatsApp numarasi girin'], 400);
    // Vergi no 10, TC kimlik 11 hane — sahis isletmesi TC ile kayit olabiliyor.
    if (strlen($taxNumber) !== 10 && strlen($taxNumber) !== 11) {
        jsonResponse(['error' => 'Vergi numarasi 10, TC kimlik numarasi 11 hane olmalidir'], 400);
    }

    $stmt = $pdo->prepare('SELECT 1 FROM cities WHERE id = ?');
    $stmt->execute([$cityId]);
    if (!$stmt->fetch()) jsonResponse(['error' => 'Gecersiz il'], 400);

    if ($districtId !== null) {
        $stmt = $pdo->prepare('SELECT 1 FROM districts WHERE id = ? AND city_id = ?');
        $stmt->execute([$districtId, $cityId]);
        if (!$stmt->fetch()) jsonResponse(['error' => 'Ilce secilen ile ait degil'], 400);
    }

    $docPath = isset($_FILES['tax_document']) ? seller_store_document($_FILES['tax_document'], $userId) : null;
    $slug    = seller_unique_slug($pdo, seller_slugify($name));

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO sellers (user_id, name, slug, city_id, district_id, address,
                                  whatsapp, phone, tax_number, tax_document_path, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "pending")'
        );
        $stmt->execute([$userId, $name, $slug, $cityId, $districtId, $address ?: null,
                        $whatsapp, $phone ?: null, $taxNumber, $docPath]);
    } catch (PDOException $e) {
        error_log('Satici kaydi hatasi: ' . $e->getMessage());
        jsonResponse(['error' => 'Magaza olusturulamadi'], 500);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Magaza basvurunuz alindi. Belgeleriniz incelendikten sonra bilgilendirileceksiniz.',
        'seller'  => ['id' => (int)$pdo->lastInsertId(), 'slug' => $slug, 'status' => 'pending'],
    ]);
}

/** Giriş yapmış kullanıcının kendi mağazası. Belge yolu istemciye DÖNMEZ. */
function handle_seller_me($pdo, int $userId): void {
    $stmt = $pdo->prepare(
        'SELECT s.id, s.name, s.slug, s.city_id, s.district_id, s.address, s.whatsapp, s.phone,
                s.status, s.rejection_reason, s.approved_at, s.created_at,
                s.median_response_minutes, s.offer_rate, s.listing_freshness_rate,
                c.name AS city_name, d.name AS district_name,
                (s.tax_document_path IS NOT NULL) AS has_document
         FROM sellers s
         JOIN cities c ON c.id = s.city_id
         LEFT JOIN districts d ON d.id = s.district_id
         WHERE s.user_id = ?'
    );
    $stmt->execute([$userId]);
    $seller = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$seller) jsonResponse(['seller' => null]);

    $seller['id']            = (int)$seller['id'];
    $seller['has_document']  = (bool)$seller['has_document'];
    jsonResponse(['seller' => $seller]);
}

/** İletişim/adres güncelleme. Ad, vergi no ve onay durumu buradan değişmez. */
function handle_seller_update($pdo, int $userId): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'POST only'], 405);

    $stmt = $pdo->prepare('SELECT id, city_id FROM sellers WHERE user_id = ?');
    $stmt->execute([$userId]);
    $seller = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$seller) jsonResponse(['error' => 'Magaza bulunamadi'], 404);

    $fields = [];
    $params = [];
    if (isset($_POST['address']))  { $fields[] = 'address = ?';  $params[] = trim($_POST['address']) ?: null; }
    if (isset($_POST['whatsapp'])) {
        $w = preg_replace('/\D+/', '', $_POST['whatsapp']);
        if (strlen($w) < 10) jsonResponse(['error' => 'Gecerli bir WhatsApp numarasi girin'], 400);
        $fields[] = 'whatsapp = ?'; $params[] = $w;
    }
    if (isset($_POST['phone']))    { $fields[] = 'phone = ?'; $params[] = preg_replace('/\D+/', '', $_POST['phone']) ?: null; }
    if (isset($_POST['district_id']) && $_POST['district_id'] !== '') {
        $d = (int)$_POST['district_id'];
        $chk = $pdo->prepare('SELECT 1 FROM districts WHERE id = ? AND city_id = ?');
        $chk->execute([$d, (int)$seller['city_id']]);
        if (!$chk->fetch()) jsonResponse(['error' => 'Ilce secilen ile ait degil'], 400);
        $fields[] = 'district_id = ?'; $params[] = $d;
    }
    if (!$fields) jsonResponse(['error' => 'Guncellenecek alan yok'], 400);

    $params[] = (int)$seller['id'];
    $stmt = $pdo->prepare('UPDATE sellers SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $stmt->execute($params);

    jsonResponse(['success' => true, 'message' => 'Magaza bilgileri guncellendi']);
}

// ==================== Admin: onay kuyruğu ====================

function handle_admin_seller_list($pdo): void {
    $status = $_GET['status'] ?? 'pending';
    if (!in_array($status, ['pending', 'approved', 'suspended', 'rejected', 'all'], true)) {
        jsonResponse(['error' => 'Gecersiz durum filtresi'], 400);
    }

    $sql = 'SELECT s.id, s.name, s.slug, s.status, s.tax_number, s.whatsapp, s.phone, s.address,
                   s.created_at, s.approved_at, s.rejection_reason,
                   c.name AS city_name, d.name AS district_name,
                   u.email AS owner_email, u.name AS owner_name,
                   (s.tax_document_path IS NOT NULL) AS has_document
            FROM sellers s
            JOIN cities c ON c.id = s.city_id
            LEFT JOIN districts d ON d.id = s.district_id
            JOIN users u ON u.id = s.user_id';
    $params = [];
    if ($status !== 'all') { $sql .= ' WHERE s.status = ?'; $params[] = $status; }
    $sql .= ' ORDER BY s.created_at DESC LIMIT 200';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) {
        $r['id'] = (int)$r['id'];
        $r['has_document'] = (bool)$r['has_document'];
    }
    jsonResponse(['sellers' => $rows]);
}

function handle_admin_seller_decide($pdo, int $adminId): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'POST only'], 405);

    $sellerId = (int)($_POST['seller_id'] ?? 0);
    $decision = $_POST['decision'] ?? '';
    $reason   = trim($_POST['reason'] ?? '');

    if (!$sellerId) jsonResponse(['error' => 'seller_id zorunlu'], 400);
    if (!in_array($decision, ['approved', 'rejected', 'suspended'], true)) {
        jsonResponse(['error' => 'decision approved|rejected|suspended olmali'], 400);
    }
    if ($decision !== 'approved' && $reason === '') {
        jsonResponse(['error' => 'Red/askiya alma icin gerekce zorunlu'], 400);
    }

    $stmt = $pdo->prepare('SELECT id, status FROM sellers WHERE id = ?');
    $stmt->execute([$sellerId]);
    if (!$stmt->fetch()) jsonResponse(['error' => 'Magaza bulunamadi'], 404);

    $stmt = $pdo->prepare(
        'UPDATE sellers
            SET status = ?,
                approved_at = CASE WHEN ? = "approved" THEN NOW() ELSE approved_at END,
                rejection_reason = ?
          WHERE id = ?'
    );
    $stmt->execute([$decision, $decision, $decision === 'approved' ? null : $reason, $sellerId]);

    admin_audit_log($pdo, $adminId, 'seller_' . $decision, $sellerId, $reason ?: null);
    jsonResponse(['success' => true, 'message' => 'Magaza durumu guncellendi', 'status' => $decision]);
}

/**
 * Vergi levhasını yalnızca admine, PHP üzerinden servis eder.
 * Dosya web kökünden erişilemez; yol DB'den gelir, istemciden değil.
 */
function handle_admin_seller_document($pdo): void {
    $sellerId = (int)($_GET['seller_id'] ?? 0);
    if (!$sellerId) jsonResponse(['error' => 'seller_id zorunlu'], 400);

    $stmt = $pdo->prepare('SELECT tax_document_path FROM sellers WHERE id = ?');
    $stmt->execute([$sellerId]);
    $path = $stmt->fetchColumn();
    if (!$path) jsonResponse(['error' => 'Belge yok'], 404);

    $full = __DIR__ . '/' . $path;
    // DB'den gelse bile yolu doğrula — dizin dışına çıkılamaz.
    $real = realpath($full);
    $base = realpath(seller_doc_dir());
    if ($real === false || $base === false || strncmp($real, $base, strlen($base)) !== 0) {
        error_log('Satici belgesi yol disinda: ' . $path);
        jsonResponse(['error' => 'Belge okunamadi'], 500);
    }

    $ext  = strtolower(pathinfo($real, PATHINFO_EXTENSION));
    $mime = $ext === 'pdf' ? 'application/pdf' : ($ext === 'png' ? 'image/png' : 'image/jpeg');
    header('Content-Type: ' . $mime);
    header('Content-Disposition: inline; filename="vergi-levhasi.' . $ext . '"');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: private, no-store');
    readfile($real);
    exit;
}

// ==================== Ortak: il/ilçe listesi ====================

function handle_geo_cities($pdo): void {
    $stmt = $pdo->query('SELECT id, name, slug FROM cities ORDER BY name');
    jsonResponse(['cities' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function handle_geo_districts($pdo): void {
    $cityId = (int)($_GET['city_id'] ?? 0);
    if (!$cityId) jsonResponse(['error' => 'city_id zorunlu'], 400);
    $stmt = $pdo->prepare('SELECT id, name, slug FROM districts WHERE city_id = ? ORDER BY name');
    $stmt->execute([$cityId]);
    jsonResponse(['districts' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}
