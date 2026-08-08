<?php
/**
 * requests.php — Talep oluşturma, görüntüleme ve satıcı eşleştirme
 *
 * handle_request_create, handle_request_detail, handle_request_mine,
 * handle_request_close, handle_seller_requests
 *
 * Bağımlılık: auth.php (get_auth_user_id)
 *             security.php (check_rate_limit)
 *             jsonResponse() (natro-index.php'de tanımlı)
 *
 * Şema: migration-marketplace-01-core.sql (requests, request_items,
 *       request_dispatches) + 03 (requests.access_token)
 *
 * TASARIM NOTLARI
 *
 * Üyeliksiz talep: otodevi talep göndermeden önce üyelik, adres ve TC Kimlik
 * istiyor; 1247 satıcıya karşı 500 tamamlanmış talebi var — darboğaz orada.
 * Burada telefon yeterli, talebe tahmin edilemez bir erişim anahtarı verilir.
 *
 * Hedefli dağıtım: otodevi'de parça taksonomisi olmadığı için talep büyük
 * ihtimalle herkese yayınlanıyor. Bizde kategori ve marka bilindiği için önce
 * o alanda ilanı olan satıcılara, sonra aynı şehirdekilere gidilir. Eşleşme
 * çıkmazsa (yeni pazaryeri, ilan az) tüm onaylı satıcılara düşer — sessizce
 * boş dönmek yerine.
 */

const REQUEST_TTL_DAYS   = 14;
const REQUEST_ITEM_MAX   = 10;
const REQUEST_DISPATCH_MAX = 25;

/** Talep satırlarını POST'tan okur: items[0][part_label] biçimi. */
function request_parse_items(): array {
    $raw = $_POST['items'] ?? null;
    if (!is_array($raw) || !$raw) {
        jsonResponse(['error' => 'En az bir parca satiri eklemelisiniz'], 400);
    }
    if (count($raw) > REQUEST_ITEM_MAX) {
        jsonResponse(['error' => 'En fazla ' . REQUEST_ITEM_MAX . ' parca satiri eklenebilir'], 400);
    }

    $items = [];
    foreach ($raw as $row) {
        if (!is_array($row)) continue;
        $label = trim((string)($row['part_label'] ?? ''));
        if ($label === '') continue;                 // boş satırlar sessizce atlanır
        if (mb_strlen($label) > 150) {
            jsonResponse(['error' => 'Parca adi en fazla 150 karakter olabilir'], 400);
        }
        $items[] = [
            'part_label'  => $label,
            'quantity'    => max(1, (int)($row['quantity'] ?? 1)),
            'oem_number'  => (trim((string)($row['oem_number'] ?? '')) ?: null),
            'category_id' => (($v = trim((string)($row['category_id'] ?? ''))) === '' ? null : (int)$v),
            'note'        => (mb_substr(trim((string)($row['note'] ?? '')), 0, 500) ?: null),
        ];
    }
    if (!$items) jsonResponse(['error' => 'En az bir parca satiri eklemelisiniz'], 400);
    return $items;
}

/** TR cep telefonu doğrular; rakamlara indirger. */
function request_normalize_phone(string $raw): string {
    $digits = preg_replace('/\D+/', '', $raw);
    if (strlen($digits) === 12 && strpos($digits, '90') === 0) $digits = substr($digits, 2);
    if (strlen($digits) === 11 && $digits[0] === '0')          $digits = substr($digits, 1);
    if (strlen($digits) !== 10 || $digits[0] !== '5') {
        jsonResponse(['error' => 'Gecerli bir cep telefonu giriniz (5xx xxx xx xx)'], 400);
    }
    return $digits;
}

/**
 * Talebi ilgili satıcılara dağıtır ve kaç satıcıya gittiğini döndürür.
 *
 * Sıra: (1) aynı marka/kategoride aktif ilanı olan satıcılar,
 *       (2) aynı şehirdeki satıcılar, (3) hiçbiri yoksa tüm onaylı satıcılar.
 */
function request_dispatch($pdo, int $requestId, ?int $manufacturerId, ?int $cityId, array $categoryIds): int {
    $sellerIds = [];

    // (1) İlgili ilanı olan satıcılar — en isabetli eşleşme.
    if ($manufacturerId !== null || $categoryIds) {
        $cond = [];
        $params = [];
        if ($manufacturerId !== null) { $cond[] = 'l.manufacturer_id = ?'; $params[] = $manufacturerId; }
        if ($categoryIds) {
            $cond[] = 'l.category_id IN (' . implode(',', array_fill(0, count($categoryIds), '?')) . ')';
            $params = array_merge($params, $categoryIds);
        }
        $sql = "SELECT DISTINCT l.seller_id
                FROM listings l JOIN sellers s ON s.id = l.seller_id
                WHERE s.status = 'approved' AND l.status = 'active' AND (" . implode(' OR ', $cond) . ')
                LIMIT ' . REQUEST_DISPATCH_MAX;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $sellerIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    // (2) Aynı şehirdeki satıcılar.
    if (count($sellerIds) < REQUEST_DISPATCH_MAX && $cityId !== null) {
        $stmt = $pdo->prepare(
            "SELECT id FROM sellers WHERE status = 'approved' AND city_id = ? LIMIT " . REQUEST_DISPATCH_MAX
        );
        $stmt->execute([$cityId]);
        $sellerIds = array_unique(array_merge($sellerIds, $stmt->fetchAll(PDO::FETCH_COLUMN)));
    }

    // (3) Fallback: pazaryeri yeniyken kimse eşleşmeyebilir.
    if (!$sellerIds) {
        $stmt = $pdo->query("SELECT id FROM sellers WHERE status = 'approved' LIMIT " . REQUEST_DISPATCH_MAX);
        $sellerIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    $sellerIds = array_slice(array_values(array_unique(array_map('intval', $sellerIds))), 0, REQUEST_DISPATCH_MAX);
    if (!$sellerIds) return 0;

    $ins = $pdo->prepare('INSERT IGNORE INTO request_dispatches (request_id, seller_id, dispatched_at) VALUES (?,?,NOW())');
    foreach ($sellerIds as $sid) $ins->execute([$requestId, $sid]);

    return count($sellerIds);
}

// ==================== Talep oluşturma ====================

function handle_request_create($pdo): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'POST only'], 405);
    if (!check_rate_limit('request_create', 10, 60)) return;

    $userId = get_auth_user_id();   // misafir olabilir
    $phone  = request_normalize_phone((string)($_POST['contact_phone'] ?? ''));
    $items  = request_parse_items();

    $vin = strtoupper(trim((string)($_POST['vin'] ?? '')));
    if ($vin !== '' && strlen($vin) !== 17) {
        jsonResponse(['error' => 'Sase numarasi 17 karakter olmalidir'], 400);
    }

    $cityId         = (($v = trim((string)($_POST['city_id'] ?? ''))) === '' ? null : (int)$v);
    $manufacturerId = (($v = trim((string)($_POST['manufacturer_id'] ?? ''))) === '' ? null : (int)$v);
    $budgetRaw      = trim((string)($_POST['budget_max'] ?? ''));
    $budget         = ($budgetRaw !== '' && is_numeric($budgetRaw)) ? (float)$budgetRaw : null;

    $token     = bin2hex(random_bytes(24));   // 48 karakter, CHAR(48) ile eşleşir
    $expiresAt = date('Y-m-d H:i:s', time() + REQUEST_TTL_DAYS * 86400);

    $pdo->beginTransaction();
    try {
        $pdo->prepare(
            'INSERT INTO requests
             (user_id, contact_phone, access_token, vehicle_id, model_id, manufacturer_id,
              vehicle_label, vin, engine_number, city_id, budget_max, status, expires_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $userId ?: null, $phone, $token,
            (($v = trim((string)($_POST['vehicle_id'] ?? ''))) === '' ? null : (int)$v),
            (($v = trim((string)($_POST['model_id'] ?? ''))) === '' ? null : (int)$v),
            $manufacturerId,
            (mb_substr(trim((string)($_POST['vehicle_label'] ?? '')), 0, 150) ?: null),
            ($vin !== '' ? $vin : null),
            (mb_substr(trim((string)($_POST['engine_number'] ?? '')), 0, 40) ?: null),
            $cityId, $budget, 'open', $expiresAt,
        ]);
        $requestId = (int)$pdo->lastInsertId();

        $ins = $pdo->prepare(
            'INSERT INTO request_items (request_id, category_id, part_label, oem_number, quantity, note)
             VALUES (?,?,?,?,?,?)'
        );
        $categoryIds = [];
        foreach ($items as $it) {
            $ins->execute([$requestId, $it['category_id'], $it['part_label'], $it['oem_number'], $it['quantity'], $it['note']]);
            if ($it['category_id']) $categoryIds[] = $it['category_id'];
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        error_log('Talep olusturma hatasi: ' . $e->getMessage());
        jsonResponse(['error' => 'Talep olusturulamadi'], 500);
    }

    // Dağıtım transaction dışında: başarısız olsa bile talep kaybolmamalı.
    $dispatched = request_dispatch($pdo, $requestId, $manufacturerId, $cityId, array_unique($categoryIds));

    jsonResponse([
        'success' => true,
        'request' => ['id' => $requestId, 'access_token' => $token, 'dispatched_to' => $dispatched],
    ]);
}

// ==================== Talep detayı ====================

/** Talebi getirir; erişim anahtarı ya da sahiplik doğrular. */
function request_readable_or_fail($pdo, int $requestId, ?string $token): array {
    $stmt = $pdo->prepare('SELECT * FROM requests WHERE id = ?');
    $stmt->execute([$requestId]);
    $req = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$req) jsonResponse(['error' => 'Talep bulunamadi'], 404);

    $userId = get_auth_user_id();
    $ownerOk = $userId && (int)$req['user_id'] === (int)$userId;
    // hash_equals: token karşılaştırmasını sabit zamanda yap.
    $tokenOk = $token !== null && $req['access_token'] !== null
               && hash_equals((string)$req['access_token'], $token);

    if (!$ownerOk && !$tokenOk) jsonResponse(['error' => 'Talep bulunamadi'], 404);
    return $req;
}

function handle_request_detail($pdo): void {
    $requestId = (int)($_GET['id'] ?? 0);
    $token     = trim((string)($_GET['t'] ?? '')) ?: null;
    if ($requestId <= 0) jsonResponse(['error' => 'id gerekli'], 400);

    $req = request_readable_or_fail($pdo, $requestId, $token);
    unset($req['access_token']);   // yanıtta anahtar geri verilmez

    $items = $pdo->prepare('SELECT * FROM request_items WHERE request_id = ? ORDER BY id');
    $items->execute([$requestId]);
    $req['items'] = $items->fetchAll(PDO::FETCH_ASSOC);

    // Her satırın teklifleri — alıcı karşılaştırabilsin diye fiyata göre sıralı.
    $offers = $pdo->prepare(
        "SELECT o.id, o.request_item_id, o.price, o.condition_type, o.warranty_days,
                o.ships_in_days, o.shipping_payer, o.note, o.status, o.created_at,
                s.name AS seller_name, s.slug AS seller_slug,
                s.median_response_minutes, c.name AS city_name
         FROM offers o
         JOIN sellers s ON s.id = o.seller_id
         LEFT JOIN cities c ON c.id = s.city_id
         WHERE o.request_item_id IN (SELECT id FROM request_items WHERE request_id = ?)
           AND o.status IN ('sent','seen','accepted')
         ORDER BY o.price ASC"
    );
    $offers->execute([$requestId]);
    $req['offers'] = $offers->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(['request' => $req]);
}

// ==================== Alıcının talepleri ====================

function handle_request_mine($pdo, int $userId): void {
    $stmt = $pdo->prepare(
        'SELECT r.id, r.vehicle_label, r.status, r.created_at, r.expires_at,
                (SELECT COUNT(*) FROM request_items ri WHERE ri.request_id = r.id) AS item_count,
                (SELECT COUNT(*) FROM offers o
                  WHERE o.request_item_id IN (SELECT id FROM request_items WHERE request_id = r.id)) AS offer_count
         FROM requests r
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC
         LIMIT 100'
    );
    $stmt->execute([$userId]);
    jsonResponse(['requests' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function handle_request_close($pdo): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'POST only'], 405);

    $requestId = (int)($_POST['request_id'] ?? 0);
    $token     = trim((string)($_POST['t'] ?? '')) ?: null;
    request_readable_or_fail($pdo, $requestId, $token);

    $pdo->prepare("UPDATE requests SET status = 'closed', closed_at = NOW() WHERE id = ?")->execute([$requestId]);
    jsonResponse(['success' => true]);
}

// ==================== Satıcıya düşen talepler ====================

function handle_seller_requests($pdo, int $userId): void {
    $seller = listing_require_seller($pdo, $userId);

    // Görüldü damgası yanıt süresi ölçümünün girdisi.
    $pdo->prepare(
        'UPDATE request_dispatches SET seen_at = NOW() WHERE seller_id = ? AND seen_at IS NULL'
    )->execute([(int)$seller['id']]);

    $stmt = $pdo->prepare(
        "SELECT r.id, r.vehicle_label, r.vin, r.city_id, r.budget_max, r.created_at, r.expires_at,
                c.name AS city_name, d.dispatched_at,
                (SELECT COUNT(*) FROM request_items ri WHERE ri.request_id = r.id) AS item_count,
                (SELECT COUNT(*) FROM offers o
                  WHERE o.seller_id = ?
                    AND o.request_item_id IN (SELECT id FROM request_items WHERE request_id = r.id)
                ) AS my_offer_count
         FROM request_dispatches d
         JOIN requests r ON r.id = d.request_id
         LEFT JOIN cities c ON c.id = r.city_id
         WHERE d.seller_id = ? AND r.status = 'open' AND r.expires_at > NOW()
         ORDER BY d.dispatched_at DESC
         LIMIT 100"
    );
    $stmt->execute([(int)$seller['id'], (int)$seller['id']]);
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Satıcı teklif verebilmek için satırları görmeli.
    if ($requests) {
        $ids = array_column($requests, 'id');
        $ph  = implode(',', array_fill(0, count($ids), '?'));
        $its = $pdo->prepare("SELECT id, request_id, part_label, oem_number, quantity, note
                              FROM request_items WHERE request_id IN ($ph) ORDER BY id");
        $its->execute($ids);
        $byRequest = [];
        foreach ($its->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $byRequest[(int)$row['request_id']][] = $row;
        }
        foreach ($requests as &$r) $r['items'] = $byRequest[(int)$r['id']] ?? [];
        unset($r);
    }

    jsonResponse(['requests' => $requests]);
}
