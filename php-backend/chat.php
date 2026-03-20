<?php
/**
 * chat.php — WhatsApp entegrasyonlu canlı destek fonksiyonları
 * handle_chat, send_whatsapp, send_whatsapp_followup,
 * handle_chat_messages, handle_chat_webhook
 *
 * Bağımlılık: Yok (bağımsız modül)
 * Env değişkenleri: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN,
 *                   WHATSAPP_ADMIN_NUMBERS, WHATSAPP_WEBHOOK_VERIFY
 */

function handle_chat($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'POST only']); return; }
    $ticketId = trim($_POST['ticket_id'] ?? '');
    $message  = trim($_POST['message'] ?? '');
    $name     = trim($_POST['name'] ?? '');
    $vehicle  = trim($_POST['vehicle'] ?? '');
    $phone    = trim($_POST['phone'] ?? '');
    $vin      = trim($_POST['vin'] ?? '');
    $pageUrl  = trim($_POST['page_url'] ?? '');

    if (!$ticketId || !$message) { http_response_code(400); echo json_encode(['error' => 'ticket_id ve message zorunludur']); return; }
    if (!preg_match('/^[A-Z0-9]{6,20}$/i', $ticketId)) { http_response_code(400); echo json_encode(['error' => 'Gecersiz ticket_id']); return; }
    if (mb_strlen($message) > 2000) $message = mb_substr($message, 0, 2000);

    $stmt = $pdo->prepare('SELECT id FROM chat_tickets WHERE ticket_id = ?');
    $stmt->execute([$ticketId]);
    $existing = $stmt->fetch();

    if (!$existing) {
        $pdo->prepare('INSERT INTO chat_tickets (ticket_id, name, phone, vehicle, vin) VALUES (?, ?, ?, ?, ?)')->execute([$ticketId, $name ?: null, $phone ?: null, $vehicle ?: null, $vin ?: null]);
    } else {
        $updates = []; $params = [];
        if ($name) { $updates[] = 'name = ?'; $params[] = $name; }
        if ($phone) { $updates[] = 'phone = ?'; $params[] = $phone; }
        if ($vehicle) { $updates[] = 'vehicle = ?'; $params[] = $vehicle; }
        if ($vin) { $updates[] = 'vin = ?'; $params[] = $vin; }
        if (!empty($updates)) { $params[] = $ticketId; $pdo->prepare('UPDATE chat_tickets SET ' . implode(', ', $updates) . ' WHERE ticket_id = ?')->execute($params); }
    }

    $pdo->prepare('INSERT INTO chat_messages (ticket_id, sender, message, page_url) VALUES (?, ?, ?, ?)')->execute([$ticketId, 'customer', $message, $pageUrl ?: null]);

    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM chat_messages WHERE ticket_id = ? AND sender = ?');
    $countStmt->execute([$ticketId, 'customer']);
    $customerMsgCount = (int)$countStmt->fetchColumn();

    if ($customerMsgCount === 1) {
        $wamid = send_whatsapp($ticketId, $message, $name, $vehicle, $phone, $vin, $pageUrl);
        if ($wamid) { $pdo->prepare('UPDATE chat_tickets SET wa_message_id = ? WHERE ticket_id = ?')->execute([$wamid, $ticketId]); }
        $autoReply = 'Talebiniz alindi! En kisa surede size donus yapacagiz. (Talep No: #' . $ticketId . ')';
        $pdo->prepare('INSERT INTO chat_messages (ticket_id, sender, message) VALUES (?, ?, ?)')->execute([$ticketId, 'system', $autoReply]);
        echo json_encode(['success' => true, 'ticket_id' => $ticketId, 'auto_reply' => $autoReply]);
    } else {
        // Devam mesajlarında da WhatsApp bildirimi gönder + wamid güncelle
        $ticketStmt = $pdo->prepare('SELECT name FROM chat_tickets WHERE ticket_id = ?');
        $ticketStmt->execute([$ticketId]);
        $ticketData = $ticketStmt->fetch(PDO::FETCH_ASSOC);
        $chatName = ($ticketData && $ticketData['name']) ? $ticketData['name'] : ($name ?: 'Musteri');
        $wamid = send_whatsapp_followup($ticketId, $message, $chatName);
        if ($wamid) { $pdo->prepare('UPDATE chat_tickets SET wa_message_id = ? WHERE ticket_id = ?')->execute([$wamid, $ticketId]); }
        echo json_encode(['success' => true, 'ticket_id' => $ticketId]);
    }
}

function send_whatsapp($ticketId, $message, $name, $vehicle, $phone, $vin, $pageUrl) {
    $phoneId = getenv('WHATSAPP_PHONE_NUMBER_ID') ?: '';
    $token = getenv('WHATSAPP_ACCESS_TOKEN') ?: '';
    $adminNumbers = array_filter(explode(',', getenv('WHATSAPP_ADMIN_NUMBERS') ?: ''));
    if (!$phoneId || !$token || empty($adminNumbers)) return null;

    $text = "Yeni Talep #$ticketId\n" . ($name ? $name : 'Anonim') . "\n" . ($phone ? "Tel: $phone\n" : "") . ($vehicle ? "Arac: $vehicle\n" : "") . ($vin ? "Sase: $vin\n" : "") . "---\n" . $message;
    $wamid = null;

    foreach ($adminNumbers as $number) {
        $ch = curl_init("https://graph.facebook.com/v21.0/$phoneId/messages");
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_HTTPHEADER => ["Authorization: Bearer $token", "Content-Type: application/json"], CURLOPT_POSTFIELDS => json_encode(['messaging_product' => 'whatsapp', 'to' => $number, 'type' => 'text', 'text' => ['body' => $text]]), CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($httpCode === 200 && $response) {
            $resData = json_decode($response, true);
            if (isset($resData['messages'][0]['id'])) $wamid = $resData['messages'][0]['id'];
        }
    }
    return $wamid;
}

function send_whatsapp_followup($ticketId, $message, $name) {
    $phoneId = getenv('WHATSAPP_PHONE_NUMBER_ID') ?: '';
    $token = getenv('WHATSAPP_ACCESS_TOKEN') ?: '';
    $adminNumbers = array_filter(explode(',', getenv('WHATSAPP_ADMIN_NUMBERS') ?: ''));
    if (!$phoneId || !$token || empty($adminNumbers)) return null;

    $text = ($name ?: 'Musteri') . " (#$ticketId):\n$message";
    $wamid = null;

    foreach ($adminNumbers as $number) {
        $ch = curl_init("https://graph.facebook.com/v21.0/$phoneId/messages");
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_HTTPHEADER => ["Authorization: Bearer $token", "Content-Type: application/json"], CURLOPT_POSTFIELDS => json_encode(['messaging_product' => 'whatsapp', 'to' => $number, 'type' => 'text', 'text' => ['body' => $text]]), CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($httpCode === 200 && $response) {
            $resData = json_decode($response, true);
            if (isset($resData['messages'][0]['id'])) $wamid = $resData['messages'][0]['id'];
        }
    }
    return $wamid;
}

function handle_chat_messages($pdo) {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); echo json_encode(['error' => 'GET only']); return; }
    $ticketId = trim($_GET['ticket_id'] ?? '');
    if (!$ticketId) { echo json_encode(['messages' => []]); return; }
    $stmt = $pdo->prepare("SELECT id, ticket_id, sender, message, created_at FROM chat_messages WHERE ticket_id = ? ORDER BY id ASC");
    $stmt->execute([$ticketId]);
    echo json_encode(['messages' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function handle_chat_webhook($pdo) {
    $verify_token = getenv('WHATSAPP_WEBHOOK_VERIFY');
    if (!$verify_token) { http_response_code(500); echo json_encode(['error' => 'Webhook not configured']); return; }
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $mode = $_GET['hub_mode'] ?? '';
        $token = $_GET['hub_verify_token'] ?? '';
        $challenge = $_GET['hub_challenge'] ?? '';
        if ($mode === 'subscribe' && $token === $verify_token) { header('Content-Type: text/plain'); echo $challenge; exit; }
        http_response_code(403); echo json_encode(['error' => 'Forbidden']); return;
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        @file_put_contents(sys_get_temp_dir() . '/parcabizden_webhook.log', date('Y-m-d H:i:s') . " " . $input . "\n", FILE_APPEND);
        if (isset($data['entry'][0]['changes'][0]['value']['messages'][0])) {
            $msg = $data['entry'][0]['changes'][0]['value']['messages'][0];
            $adminMessage = $msg['text']['body'] ?? '';
            if ($adminMessage) {
                $ticket = null;

                // Yöntem 1: Reply varsa (context.id) → wamid ile eşle
                if (isset($msg['context']['id'])) {
                    $stmt = $pdo->prepare("SELECT ticket_id FROM chat_tickets WHERE wa_message_id = ? LIMIT 1");
                    $stmt->execute([$msg['context']['id']]);
                    $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
                }

                // Yöntem 2: Reply yoksa → en son aktif ticket'a eşle
                if (!$ticket) {
                    $stmt = $pdo->prepare("SELECT ct.ticket_id FROM chat_tickets ct INNER JOIN chat_messages cm ON ct.ticket_id = cm.ticket_id WHERE ct.wa_message_id IS NOT NULL GROUP BY ct.ticket_id ORDER BY MAX(cm.id) DESC LIMIT 1");
                    $stmt->execute();
                    $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
                }

                if ($ticket) {
                    $pdo->prepare("INSERT INTO chat_messages (ticket_id, sender, message, created_at) VALUES (?, 'admin', ?, NOW())")->execute([$ticket['ticket_id'], $adminMessage]);
                }
            }
        }
        http_response_code(200); echo json_encode(['status' => 'ok']); return;
    }
}
