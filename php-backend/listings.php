<?php
/**
 * listings.php — İlan oluşturma, listeleme, arama ve yaşam döngüsü
 *
 * handle_listing_create, handle_listing_mine, handle_listing_detail,
 * handle_listing_search, handle_listing_set_status, handle_listing_confirm
 *
 * Bağımlılık: auth.php (get_auth_user_id)
 *             security.php (check_rate_limit)
 *             jsonResponse() (natro-index.php'de tanımlı)
 *
 * Şema: migration-marketplace-01-core.sql (listings, listing_images, sellers)
 *
 * TASARIM NOTLARI
 *
 * Fiyat: net fiyat ya da bant zorunlu. "Fiyat sorunuz" seçeneği bilinçli
 * olarak yok — rakiplerde ilanların çoğu fiyatsız olduğu için karşılaştırma
 * imkânsız hale geliyor.
 *
 * Tazelik: ilan LISTING_TTL_DAYS sonra süresi dolar. Satıcı "hâlâ var" derse
 * (listing_confirm) süre uzar. Rakipte satış WhatsApp'ta kapandığı için
 * platform ilanın satıldığını asla öğrenemiyor ve envanter bayatlıyor.
 *
 * Uyum: fitment_source alanı uyumun nereden geldiğini saklar. Satıcı araç
 * seçiciden bir KType seçtiyse katalogdan doğrulanmış sayılır; serbest metin
 * girdiyse beyandır. Alıcıya bu ayrım gösterilir.
 */

const LISTING_TTL_DAYS      = 45;
const LISTING_IMAGE_MAX     = 8;
const LISTING_IMAGE_BYTES   = 5 * 1024 * 1024;
const LISTING_IMAGE_TYPES   = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
const LISTING_PAGE_SIZE_MAX = 60;

function listing_image_dir(): string {
    return __DIR__ . '/uploads/listings';
}

/** Türkçe metni URL-güvenli slug'a çevirir (sellers.php ile aynı kurallar). */
function listing_slugify(string $text): string {
    $map = ['ç'=>'c','Ç'=>'c','ğ'=>'g','Ğ'=>'g','ı'=>'i','I'=>'i','İ'=>'i',
            'ö'=>'o','Ö'=>'o','ş'=>'s','Ş'=>'s','ü'=>'u','Ü'=>'u'];
    $text = strtr($text, $map);
    $text = mb_strtolower($text, 'UTF-8');
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    return trim((string)$text, '-');
}

function listing_unique_slug($pdo, string $base): string {
    $base = $base !== '' ? mb_substr($base, 0, 180) : 'ilan';
    $stmt = $pdo->prepare('SELECT 1 FROM listings WHERE slug = ?');
    $slug = $base;
    for ($i = 2; $i <= 50; $i++) {
        $stmt->execute([$slug]);
        if (!$stmt->fetch()) return $slug;
        $slug = $base . '-' . $i;
    }
    return $base . '-' . bin2hex(random_bytes(3));
}

/**
 * Giriş yapan kullanıcının onaylı satıcı kaydını döndürür, yoksa 403.
 *
 * Hesap tipi de burada doğrulanır — üç ayrı alan adı bir güvenlik sınırı
 * değil; API doğrudan çağrılabilir. Tip token'dan değil her istekte DB'den
 * okunur, böylece rol geri alındığında oturum beklemeden erişim kapanır.
 */
function listing_require_seller($pdo, int $userId): array {
    $acc = $pdo->prepare('SELECT account_type FROM users WHERE id = ? AND deleted_at IS NULL');
    $acc->execute([$userId]);
    $accountType = $acc->fetchColumn();
    if ($accountType === false) jsonResponse(['error' => 'Oturum gecersiz'], 401);
    if ($accountType !== 'seller') {
        jsonResponse(['error' => 'Bu islem satici hesabi gerektirir', 'code' => 'not_seller'], 403);
    }

    $stmt = $pdo->prepare('SELECT id, status FROM sellers WHERE user_id = ?');
    $stmt->execute([$userId]);
    $seller = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$seller) {
        jsonResponse(['error' => 'Once magaza acmalisiniz', 'code' => 'no_seller'], 403);
    }
    if ($seller['status'] !== 'approved') {
        jsonResponse(['error' => 'Magazaniz henuz onaylanmadi', 'code' => 'seller_' . $seller['status']], 403);
    }
    return $seller;
}

/**
 * Yüklenen görselleri diske yazar, göreli yolları döndürür.
 * MIME tipi uzantıdan değil dosya içeriğinden okunur; dosya adı sunucuda
 * üretilir (istemci adı hiç kullanılmaz — path traversal önlemi).
 */
function listing_store_images(array $files, int $listingId): array {
    $dir = listing_image_dir() . '/' . $listingId;
    if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
        error_log('Ilan gorsel dizini olusturulamadi: ' . $dir);
        jsonResponse(['error' => 'Gorseller kaydedilemedi'], 500);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $paths = [];
    $count = min(count($files['name']), LISTING_IMAGE_MAX);

    for ($i = 0; $i < $count; $i++) {
        if (($files['error'][$i] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) continue;
        if (($files['size'][$i] ?? 0) > LISTING_IMAGE_BYTES) {
            jsonResponse(['error' => 'Her gorsel en fazla 5 MB olabilir'], 400);
        }
        $mime = $finfo->file($files['tmp_name'][$i]);
        if (!isset(LISTING_IMAGE_TYPES[$mime])) {
            jsonResponse(['error' => 'Gorseller yalnizca JPG, PNG veya WEBP olabilir'], 400);
        }
        $name = sprintf('%d-%s.%s', $i, bin2hex(random_bytes(6)), LISTING_IMAGE_TYPES[$mime]);
        if (!move_uploaded_file($files['tmp_name'][$i], $dir . '/' . $name)) {
            error_log('Ilan gorseli tasinamadi: ' . $name);
            continue;
        }
        $paths[] = 'uploads/listings/' . $listingId . '/' . $name;
    }
    return $paths;
}

/** Fiyat girdisini doğrular; [price, price_min, price_max] döndürür. */
function listing_parse_price(): array {
    $price    = trim((string)($_POST['price'] ?? ''));
    $priceMin = trim((string)($_POST['price_min'] ?? ''));
    $priceMax = trim((string)($_POST['price_max'] ?? ''));

    if ($price !== '') {
        if (!is_numeric($price) || (float)$price <= 0) {
            jsonResponse(['error' => 'Fiyat gecerli bir sayi olmali'], 400);
        }
        return [(float)$price, null, null];
    }
    if ($priceMin !== '' && $priceMax !== '') {
        if (!is_numeric($priceMin) || !is_numeric($priceMax)) {
            jsonResponse(['error' => 'Fiyat araligi gecerli sayilar olmali'], 400);
        }
        if ((float)$priceMin <= 0 || (float)$priceMax < (float)$priceMin) {
            jsonResponse(['error' => 'Fiyat araligi gecersiz'], 400);
        }
        return [null, (float)$priceMin, (float)$priceMax];
    }
    jsonResponse(['error' => 'Net fiyat veya fiyat araligi zorunludur'], 400);
}

function listing_int_or_null(string $key): ?int {
    $v = trim((string)($_POST[$key] ?? ''));
    return $v === '' ? null : (int)$v;
}

// ==================== İlan oluşturma ====================

function handle_listing_create($pdo, int $userId): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'POST only'], 405);
    if (!check_rate_limit('listing_create', 30, 60)) return;

    $seller = listing_require_seller($pdo, $userId);

    $title     = trim((string)($_POST['title'] ?? ''));
    $partLabel = trim((string)($_POST['part_label'] ?? ''));
    $condition = trim((string)($_POST['condition_type'] ?? 'cikma'));

    if (mb_strlen($title) < 10 || mb_strlen($title) > 200) {
        jsonResponse(['error' => 'Baslik 10-200 karakter olmali'], 400);
    }
    if ($partLabel === '' || mb_strlen($partLabel) > 150) {
        jsonResponse(['error' => 'Parca adi zorunlu (en fazla 150 karakter)'], 400);
    }
    if (!in_array($condition, ['cikma', 'sifir', 'yenilenmis'], true)) {
        jsonResponse(['error' => 'Gecersiz parca durumu'], 400);
    }

    [$price, $priceMin, $priceMax] = listing_parse_price();

    $shippingPayer = trim((string)($_POST['shipping_payer'] ?? 'buyer'));
    if (!in_array($shippingPayer, ['buyer', 'seller', 'negotiable'], true)) $shippingPayer = 'buyer';

    $quantity = max(1, (int)($_POST['quantity'] ?? 1));
    $vehicleId = listing_int_or_null('vehicle_id');

    // Araç seçiciden KType geldiyse uyum katalogdan doğrulanmış sayılır.
    $fitmentSource = $vehicleId !== null ? 'catalog_verified' : 'seller_declared';

    $slug = listing_unique_slug($pdo, listing_slugify($title));
    $expiresAt = date('Y-m-d H:i:s', time() + LISTING_TTL_DAYS * 86400);

    $sql = 'INSERT INTO listings
        (seller_id, title, slug, description,
         vehicle_id, model_id, manufacturer_id, vehicle_label, year_from, year_to,
         category_id, part_label, oem_number, fitment_source,
         condition_type, quantity, price, price_min, price_max, shipping_payer,
         status, published_at, last_confirmed_at, expires_at)
        VALUES (?,?,?,?, ?,?,?,?,?,?, ?,?,?,?, ?,?,?,?,?,?, ?, NOW(), NOW(), ?)';

    $pdo->prepare($sql)->execute([
        (int)$seller['id'], $title, $slug, (trim((string)($_POST['description'] ?? '')) ?: null),
        $vehicleId, listing_int_or_null('model_id'), listing_int_or_null('manufacturer_id'),
        (trim((string)($_POST['vehicle_label'] ?? '')) ?: null),
        listing_int_or_null('year_from'), listing_int_or_null('year_to'),
        listing_int_or_null('category_id'), $partLabel,
        (trim((string)($_POST['oem_number'] ?? '')) ?: null), $fitmentSource,
        $condition, $quantity, $price, $priceMin, $priceMax, $shippingPayer,
        'pending_review', $expiresAt,
    ]);
    $listingId = (int)$pdo->lastInsertId();

    if (!empty($_FILES['images']['name']) && is_array($_FILES['images']['name'])) {
        $paths = listing_store_images($_FILES['images'], $listingId);
        if ($paths) {
            $img = $pdo->prepare('INSERT INTO listing_images (listing_id, path, sort_order) VALUES (?,?,?)');
            foreach ($paths as $i => $p) $img->execute([$listingId, $p, $i]);
        }
    }

    jsonResponse([
        'success' => true,
        'listing' => ['id' => $listingId, 'slug' => $slug, 'status' => 'pending_review'],
    ]);
}

// ==================== Satıcının kendi ilanları ====================

function handle_listing_mine($pdo, int $userId): void {
    $seller = listing_require_seller($pdo, $userId);
    $stmt = $pdo->prepare(
        'SELECT l.id, l.title, l.slug, l.part_label, l.condition_type, l.quantity,
                l.price, l.price_min, l.price_max, l.status, l.vehicle_label,
                l.published_at, l.last_confirmed_at, l.expires_at, l.view_count,
                (SELECT path FROM listing_images WHERE listing_id = l.id ORDER BY sort_order LIMIT 1) AS cover
         FROM listings l
         WHERE l.seller_id = ?
         ORDER BY l.created_at DESC
         LIMIT 200'
    );
    $stmt->execute([(int)$seller['id']]);
    jsonResponse(['listings' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

// ==================== İlan detayı (herkese açık) ====================

function handle_listing_detail($pdo): void {
    $slug = trim((string)($_GET['slug'] ?? ''));
    $id   = (int)($_GET['id'] ?? 0);
    if ($slug === '' && $id <= 0) jsonResponse(['error' => 'slug veya id gerekli'], 400);

    $where = $slug !== '' ? 'l.slug = ?' : 'l.id = ?';
    $param = $slug !== '' ? $slug : $id;

    $stmt = $pdo->prepare(
        "SELECT l.*, s.name AS seller_name, s.slug AS seller_slug, s.whatsapp AS seller_whatsapp,
                s.phone AS seller_phone, s.status AS seller_status,
                s.median_response_minutes, c.name AS city_name, d.name AS district_name
         FROM listings l
         JOIN sellers s ON s.id = l.seller_id
         LEFT JOIN cities c    ON c.id = s.city_id
         LEFT JOIN districts d ON d.id = s.district_id
         WHERE $where LIMIT 1"
    );
    $stmt->execute([$param]);
    $listing = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$listing) jsonResponse(['error' => 'Ilan bulunamadi'], 404);

    // Yayında olmayan ilanı yalnızca sahibi görebilir.
    if ($listing['status'] !== 'active') {
        $viewerId = get_auth_user_id();
        $ownerOk = false;
        if ($viewerId) {
            $own = $pdo->prepare('SELECT 1 FROM sellers WHERE id = ? AND user_id = ?');
            $own->execute([(int)$listing['seller_id'], (int)$viewerId]);
            $ownerOk = (bool)$own->fetch();
        }
        if (!$ownerOk) jsonResponse(['error' => 'Ilan bulunamadi'], 404);
    }

    $imgs = $pdo->prepare('SELECT path FROM listing_images WHERE listing_id = ? ORDER BY sort_order');
    $imgs->execute([(int)$listing['id']]);
    $listing['images'] = $imgs->fetchAll(PDO::FETCH_COLUMN);

    $pdo->prepare('UPDATE listings SET view_count = view_count + 1 WHERE id = ?')
        ->execute([(int)$listing['id']]);

    jsonResponse(['listing' => $listing]);
}

// ==================== Arama / listeleme ====================

function handle_listing_search($pdo): void {
    $where  = ["l.status = 'active'", '(l.expires_at IS NULL OR l.expires_at > NOW())'];
    $params = [];

    foreach (['manufacturer_id', 'model_id', 'vehicle_id', 'category_id'] as $col) {
        $v = (int)($_GET[$col] ?? 0);
        if ($v > 0) { $where[] = "l.$col = ?"; $params[] = $v; }
    }

    $cityId = (int)($_GET['city_id'] ?? 0);
    if ($cityId > 0) { $where[] = 's.city_id = ?'; $params[] = $cityId; }

    $condition = trim((string)($_GET['condition_type'] ?? ''));
    if (in_array($condition, ['cikma', 'sifir', 'yenilenmis'], true)) {
        $where[] = 'l.condition_type = ?'; $params[] = $condition;
    }

    // Bant fiyatlı ilanlarda alt/üst sınır üzerinden karşılaştır.
    $priceMin = trim((string)($_GET['price_min'] ?? ''));
    if ($priceMin !== '' && is_numeric($priceMin)) {
        $where[] = 'COALESCE(l.price, l.price_max) >= ?'; $params[] = (float)$priceMin;
    }
    $priceMax = trim((string)($_GET['price_max'] ?? ''));
    if ($priceMax !== '' && is_numeric($priceMax)) {
        $where[] = 'COALESCE(l.price, l.price_min) <= ?'; $params[] = (float)$priceMax;
    }

    $q = trim((string)($_GET['q'] ?? ''));
    if ($q !== '') {
        $where[] = '(l.title LIKE ? OR l.part_label LIKE ? OR l.oem_number LIKE ?)';
        $like = '%' . $q . '%';
        array_push($params, $like, $like, $like);
    }

    $sortMap = [
        'newest'     => 'l.published_at DESC',
        'price_asc'  => 'COALESCE(l.price, l.price_min) ASC',
        'price_desc' => 'COALESCE(l.price, l.price_max) DESC',
    ];
    $sort = $sortMap[$_GET['sort'] ?? 'newest'] ?? $sortMap['newest'];

    $perPage = min(max((int)($_GET['per_page'] ?? 24), 1), LISTING_PAGE_SIZE_MAX);
    $page    = max((int)($_GET['page'] ?? 1), 1);
    $offset  = ($page - 1) * $perPage;
    $whereSql = implode(' AND ', $where);

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM listings l JOIN sellers s ON s.id = l.seller_id WHERE $whereSql");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $sql = "SELECT l.id, l.title, l.slug, l.part_label, l.condition_type,
                   l.price, l.price_min, l.price_max, l.vehicle_label, l.oem_number,
                   l.fitment_source, l.published_at,
                   s.name AS seller_name, s.slug AS seller_slug,
                   c.name AS city_name, d.name AS district_name,
                   (SELECT path FROM listing_images WHERE listing_id = l.id ORDER BY sort_order LIMIT 1) AS cover
            FROM listings l
            JOIN sellers s ON s.id = l.seller_id
            LEFT JOIN cities c    ON c.id = s.city_id
            LEFT JOIN districts d ON d.id = s.district_id
            WHERE $whereSql
            ORDER BY $sort
            LIMIT $perPage OFFSET $offset";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    jsonResponse([
        'listings' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        'total'    => $total,
        'page'     => $page,
        'per_page' => $perPage,
    ]);
}

// ==================== Yaşam döngüsü ====================

/** Satıcının kendi ilanını döndürür, değilse 403/404. */
function listing_owned_or_fail($pdo, int $userId, int $listingId): array {
    $seller = listing_require_seller($pdo, $userId);
    $stmt = $pdo->prepare('SELECT id, status FROM listings WHERE id = ? AND seller_id = ?');
    $stmt->execute([$listingId, (int)$seller['id']]);
    $listing = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$listing) jsonResponse(['error' => 'Ilan bulunamadi'], 404);
    return $listing;
}

function handle_listing_set_status($pdo, int $userId): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'POST only'], 405);

    $listingId = (int)($_POST['listing_id'] ?? 0);
    $status    = trim((string)($_POST['status'] ?? ''));
    if (!in_array($status, ['active', 'reserved', 'sold', 'removed'], true)) {
        jsonResponse(['error' => 'Gecersiz durum'], 400);
    }
    listing_owned_or_fail($pdo, $userId, $listingId);

    // Satıldı işaretlemek tazelik sinyalinin ta kendisi — satış tarihini saklıyoruz.
    $soldAt = $status === 'sold' ? 'NOW()' : 'NULL';
    $pdo->prepare("UPDATE listings SET status = ?, sold_at = $soldAt, last_confirmed_at = NOW() WHERE id = ?")
        ->execute([$status, $listingId]);

    jsonResponse(['success' => true, 'status' => $status]);
}

/**
 * "Bu ilan hâlâ geçerli" teyidi — süreyi uzatır.
 * Rakiplerin en büyük yapısal açığı bayat envanter; teyit edilmeyen ilan düşer.
 */
function handle_listing_confirm($pdo, int $userId): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'POST only'], 405);

    $listingId = (int)($_POST['listing_id'] ?? 0);
    listing_owned_or_fail($pdo, $userId, $listingId);

    $expiresAt = date('Y-m-d H:i:s', time() + LISTING_TTL_DAYS * 86400);
    $pdo->prepare(
        "UPDATE listings
         SET last_confirmed_at = NOW(), expires_at = ?,
             status = CASE WHEN status = 'expired' THEN 'active' ELSE status END
         WHERE id = ?"
    )->execute([$expiresAt, $listingId]);

    jsonResponse(['success' => true, 'expires_at' => $expiresAt]);
}
