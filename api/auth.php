<?php

class JWT {
    /**
     * Create a JWT token
     */
    public static function encode(array $payload): string {
        $header = self::base64UrlEncode(json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256'
        ]));

        $payload['iat'] = time();
        $payload['exp'] = time() + JWT_EXPIRY;

        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payloadEncoded", JWT_SECRET, true)
        );

        return "$header.$payloadEncoded.$signature";
    }

    /**
     * Decode and verify a JWT token
     */
    public static function decode(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        [$header, $payload, $signature] = $parts;

        // Verify signature
        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
        );

        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $data = json_decode(self::base64UrlDecode($payload), true);

        // Check expiration
        if (!$data || !isset($data['exp']) || $data['exp'] < time()) {
            return null;
        }

        return $data;
    }

    /**
     * Extract user ID from Authorization header
     */
    public static function getUserId(): ?int {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
            return null;
        }

        $payload = self::decode($matches[1]);
        return $payload['user_id'] ?? null;
    }

    /**
     * Require authentication - returns user ID or sends 401
     */
    public static function requireAuth(): int {
        $userId = self::getUserId();
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => 'Yetkilendirme gerekli. Lütfen giriş yapın.']);
            exit;
        }
        return $userId;
    }

    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}

/**
 * Send JSON response
 */
function jsonResponse(mixed $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Get JSON request body
 */
function getJsonBody(): array {
    $body = file_get_contents('php://input');
    return json_decode($body, true) ?? [];
}

/**
 * Get pagination parameters with security limits
 */
function getPagination(): array {
    $page = max(1, min(10000, (int) ($_GET['page'] ?? 1))); // Max page: 10000
    $limit = min(50, max(1, (int) ($_GET['limit'] ?? ITEMS_PER_PAGE))); // Max limit: 50 (reduced from 100)
    $offset = ($page - 1) * $limit;

    // Max offset validation (500000 records max)
    if ($offset > 500000) {
        http_response_code(400);
        echo json_encode(['error' => 'Sayfa numarası çok yüksek. Lütfen daha düşük bir sayfa numarası kullanın.']);
        exit;
    }

    return [$page, $limit, $offset];
}
