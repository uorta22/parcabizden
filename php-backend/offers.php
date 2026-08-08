<?php
/**
 * offers.php — Teklif verme, geri çekme ve alıcının kararı
 *
 * handle_offer_create, handle_offer_withdraw, handle_offer_mine, handle_offer_decide
 *
 * Bağımlılık: auth.php (get_auth_user_id)
 *             listings.php (listing_require_seller)
 *             requests.php (request_readable_or_fail)
 *             security.php (check_rate_limit)
 *
 * Şema: migration-marketplace-01-core.sql (offers, request_items, sellers)
 *
 * TASARIM NOTU
 * Teklif yapısaldır: fiyat, parça durumu, garanti ve teslim süresi ayrı
 * alanlardır. Rakiplerde teklif serbest metin (WhatsApp mesajı ya da tek
 * fiyat kutusu) olduğu için alıcı elmayla armudu karşılaştırıyor — orijinal
 * mi çıkma mı, garantili mi, ne zaman gelir belli olmuyor.
 *
 * Satıcı bir satıra tek teklif verir (uq_offer_once). Fikir değiştirirse
 * geri çeker ve yeniden verir; böylece fiyat kırma turu kayıt altında kalır.
 */

const OFFER_TTL_DAYS = 7;

/** Teklif verilecek satırı ve talebi getirir; uygun değilse hata döner. */
function offer_target_or_fail($pdo, int $requestItemId): array {
    $stmt = $pdo->prepare(
        'SELECT ri.id AS item_id, ri.request_id, ri.status AS item_status,
                r.status AS request_status, r.expires_at
         FROM request_items ri
         JOIN requests r ON r.id = ri.request_id
         WHERE ri.id = ?'
    );
    $stmt->execute([$requestItemId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) jsonResponse(['error' => 'Talep satiri bulunamadi'], 404);

    if ($row['request_status'] !== 'open') jsonResponse(['error' => 'Bu talep kapanmis'], 409);
    if ($row['item_status'] !== 'open')    jsonResponse(['error' => 'Bu satir icin secim yapilmis'], 409);
    if (strtotime((string)$row['expires_at']) < time()) jsonResponse(['error' => 'Bu talebin suresi dolmus'], 409);

    return $row;
}

/** Satıcının bu talebe dağıtıldığını doğrular — davetsiz teklif engellenir. */
function offer_require_dispatch($pdo, int $sellerId, int $requestId): void {
    $stmt = $pdo->prepare('SELECT 1 FROM request_dispatches WHERE request_id = ? AND seller_id = ?');
    $stmt->execute([$requestId, $sellerId]);
    if (!$stmt->fetch()) jsonResponse(['error' => 'Bu talep size iletilmemis'], 403);
}

// ==================== Teklif verme ====================

function handle_offer_create($pdo, int $userId): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'POST only'], 405);
    if (!check_rate_limit('offer_create', 60, 60)) return;

    $seller = listing_require_seller($pdo, $userId);
    $itemId = (int)($_POST['request_item_id'] ?? 0);
    $target = offer_target_or_fail($pdo, $itemId);
    offer_require_dispatch($pdo, (int)$seller['id'], (int)$target['request_id']);

    $price = trim((string)($_POST['price'] ?? ''));
    if (!is_numeric($price) || (float)$price <= 0) {
        jsonResponse(['error' => 'Gecerli bir fiyat giriniz'], 400);
    }

    $condition = trim((string)($_POST['condition_type'] ?? ''));
    if (!in_array($condition, ['cikma', 'sifir', 'yenilenmis'], true)) {
        jsonResponse(['error' => 'Parca durumu secilmelidir'], 400);
    }

    $shippingPayer = trim((string)($_POST['shipping_payer'] ?? 'buyer'));
    if (!in_array($shippingPayer, ['buyer', 'seller', 'negotiable'], true)) $shippingPayer = 'buyer';

    $warrantyDays = max(0, (int)($_POST['warranty_days'] ?? 0));
    $shipsInRaw   = trim((string)($_POST['ships_in_days'] ?? ''));
    $shipsIn      = $shipsInRaw === '' ? null : max(0, (int)$shipsInRaw);
    $listingIdRaw = trim((string)($_POST['listing_id'] ?? ''));
    $listingId    = $listingIdRaw === '' ? null : (int)$listingIdRaw;

    // Stoktan teklif veriliyorsa ilan gerçekten bu satıcıya ait olmalı.
    if ($listingId !== null) {
        $own = $pdo->prepare('SELECT 1 FROM listings WHERE id = ? AND seller_id = ?');
        $own->execute([$listingId, (int)$seller['id']]);
        if (!$own->fetch()) jsonResponse(['error' => 'Ilan size ait degil'], 403);
    }

    $expiresAt = date('Y-m-d H:i:s', time() + OFFER_TTL_DAYS * 86400);

    try {
        $pdo->prepare(
            'INSERT INTO offers
             (request_item_id, seller_id, listing_id, price, condition_type,
              warranty_days, ships_in_days, shipping_payer, note, status, expires_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $itemId, (int)$seller['id'], $listingId, (float)$price, $condition,
            $warrantyDays, $shipsIn, $shippingPayer,
            (mb_substr(trim((string)($_POST['note'] ?? '')), 0, 500) ?: null),
            'sent', $expiresAt,
        ]);
    } catch (PDOException $e) {
        // uq_offer_once: satıcı bu satıra zaten teklif vermiş.
        if ($e->getCode() === '23000') {
            jsonResponse(['error' => 'Bu satira zaten teklif verdiniz. Once geri cekin.'], 409);
        }
        throw $e;
    }

    jsonResponse(['success' => true, 'offer_id' => (int)$pdo->lastInsertId()]);
}

// ==================== Teklifi geri çekme ====================

function handle_offer_withdraw($pdo, int $userId): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'POST only'], 405);

    $seller  = listing_require_seller($pdo, $userId);
    $offerId = (int)($_POST['offer_id'] ?? 0);

    $stmt = $pdo->prepare('SELECT status FROM offers WHERE id = ? AND seller_id = ?');
    $stmt->execute([$offerId, (int)$seller['id']]);
    $offer = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$offer) jsonResponse(['error' => 'Teklif bulunamadi'], 404);
    if ($offer['status'] === 'accepted') {
        jsonResponse(['error' => 'Kabul edilmis teklif geri cekilemez'], 409);
    }

    // Silmek yerine işaretliyoruz: fiyat kırma turu kayıtta kalsın.
    $pdo->prepare("UPDATE offers SET status = 'withdrawn', decided_at = NOW() WHERE id = ?")->execute([$offerId]);
    jsonResponse(['success' => true]);
}

// ==================== Satıcının teklifleri ====================

function handle_offer_mine($pdo, int $userId): void {
    $seller = listing_require_seller($pdo, $userId);
    $stmt = $pdo->prepare(
        'SELECT o.id, o.price, o.condition_type, o.warranty_days, o.ships_in_days,
                o.status, o.created_at, o.seen_at, o.decided_at,
                ri.part_label, ri.quantity, r.id AS request_id, r.vehicle_label
         FROM offers o
         JOIN request_items ri ON ri.id = o.request_item_id
         JOIN requests r ON r.id = ri.request_id
         WHERE o.seller_id = ?
         ORDER BY o.created_at DESC
         LIMIT 200'
    );
    $stmt->execute([(int)$seller['id']]);
    jsonResponse(['offers' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

// ==================== Alıcının kararı ====================

function handle_offer_decide($pdo): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'POST only'], 405);

    $offerId  = (int)($_POST['offer_id'] ?? 0);
    $decision = trim((string)($_POST['decision'] ?? ''));
    if (!in_array($decision, ['accepted', 'rejected'], true)) {
        jsonResponse(['error' => 'Karar accepted veya rejected olmalidir'], 400);
    }

    $stmt = $pdo->prepare(
        'SELECT o.id, o.status, o.request_item_id, ri.request_id
         FROM offers o JOIN request_items ri ON ri.id = o.request_item_id
         WHERE o.id = ?'
    );
    $stmt->execute([$offerId]);
    $offer = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$offer) jsonResponse(['error' => 'Teklif bulunamadi'], 404);

    // Talebe erişimi olan (sahip ya da anahtar taşıyan) karar verebilir.
    $token = trim((string)($_POST['t'] ?? '')) ?: null;
    request_readable_or_fail($pdo, (int)$offer['request_id'], $token);

    if (!in_array($offer['status'], ['sent', 'seen'], true)) {
        jsonResponse(['error' => 'Bu teklif icin karar verilmis'], 409);
    }

    $pdo->beginTransaction();
    try {
        $pdo->prepare('UPDATE offers SET status = ?, decided_at = NOW() WHERE id = ?')
            ->execute([$decision, $offerId]);

        if ($decision === 'accepted') {
            // Satır kapanır; aynı satırdaki diğer teklifler otomatik reddedilir.
            $pdo->prepare("UPDATE request_items SET status = 'fulfilled' WHERE id = ?")
                ->execute([(int)$offer['request_item_id']]);
            $pdo->prepare(
                "UPDATE offers SET status = 'rejected', decided_at = NOW()
                 WHERE request_item_id = ? AND id <> ? AND status IN ('sent','seen')"
            )->execute([(int)$offer['request_item_id'], $offerId]);

            // Tüm satırlar kapandıysa talep de kapanır.
            $open = $pdo->prepare("SELECT COUNT(*) FROM request_items WHERE request_id = ? AND status = 'open'");
            $open->execute([(int)$offer['request_id']]);
            if ((int)$open->fetchColumn() === 0) {
                $pdo->prepare("UPDATE requests SET status = 'closed', closed_at = NOW() WHERE id = ?")
                    ->execute([(int)$offer['request_id']]);
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        error_log('Teklif karari hatasi: ' . $e->getMessage());
        jsonResponse(['error' => 'Islem tamamlanamadi'], 500);
    }

    jsonResponse(['success' => true, 'status' => $decision]);
}
