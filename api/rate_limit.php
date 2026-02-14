<?php

/**
 * File-based Rate Limiter
 *
 * Simple rate limiting implementation using file system storage.
 * No Redis or external dependencies required.
 */
class RateLimiter {
    private const STORAGE_PATH = __DIR__ . '/tmp/rate_limits/';

    // Rate limit configurations: [max_attempts, window_seconds]
    private const LIMITS = [
        'auth' => [5, 900],      // 5 attempts per 15 minutes
        'search' => [30, 60],    // 30 requests per minute
        'general' => [60, 60]    // 60 requests per minute
    ];

    /**
     * Check if request should be rate limited
     *
     * @param string $type Rate limit type: 'auth', 'search', or 'general'
     * @return bool True if allowed, false if rate limited
     */
    public static function check(string $type = 'general'): bool {
        // Initialize storage directory
        self::initStorage();

        // Get client IP
        $ip = self::getClientIp();

        // Get rate limit config
        if (!isset(self::LIMITS[$type])) {
            $type = 'general';
        }
        [$maxAttempts, $windowSeconds] = self::LIMITS[$type];

        // Create a unique file for this IP and type
        $filename = self::STORAGE_PATH . self::sanitizeFilename($ip . '_' . $type);

        // Read current attempts
        $attempts = self::readAttempts($filename);

        // Clean old attempts outside the time window
        $now = time();
        $cutoff = $now - $windowSeconds;
        $attempts = array_filter($attempts, fn($timestamp) => $timestamp > $cutoff);

        // Check if limit exceeded
        if (count($attempts) >= $maxAttempts) {
            // Calculate retry after
            $oldestAttempt = min($attempts);
            $retryAfter = $windowSeconds - ($now - $oldestAttempt);

            self::sendRateLimitResponse($retryAfter, $maxAttempts, $windowSeconds);
            return false;
        }

        // Add current attempt
        $attempts[] = $now;
        self::writeAttempts($filename, $attempts);

        // Cleanup old files (every 100 requests on average)
        if (rand(1, 100) === 1) {
            self::cleanup();
        }

        return true;
    }

    /**
     * Initialize storage directory
     */
    private static function initStorage(): void {
        if (!is_dir(self::STORAGE_PATH)) {
            mkdir(self::STORAGE_PATH, 0755, true);

            // Create .htaccess to deny access
            $htaccess = self::STORAGE_PATH . '.htaccess';
            if (!file_exists($htaccess)) {
                file_put_contents($htaccess, "Deny from all\n");
            }
        }
    }

    /**
     * Get client IP address
     */
    private static function getClientIp(): string {
        $headers = [
            'HTTP_CF_CONNECTING_IP',  // Cloudflare
            'HTTP_X_FORWARDED_FOR',    // Proxy
            'HTTP_X_REAL_IP',          // Nginx proxy
            'REMOTE_ADDR'              // Default
        ];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                // Handle comma-separated IPs (take first one)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                // Validate IP
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return '0.0.0.0';
    }

    /**
     * Sanitize filename to prevent directory traversal
     */
    private static function sanitizeFilename(string $name): string {
        return md5($name) . '.txt';
    }

    /**
     * Read attempts from file
     */
    private static function readAttempts(string $filename): array {
        if (!file_exists($filename)) {
            return [];
        }

        $content = @file_get_contents($filename);
        if ($content === false) {
            return [];
        }

        $data = json_decode($content, true);
        return is_array($data) ? $data : [];
    }

    /**
     * Write attempts to file
     */
    private static function writeAttempts(string $filename, array $attempts): void {
        @file_put_contents($filename, json_encode($attempts), LOCK_EX);
    }

    /**
     * Send rate limit exceeded response
     */
    private static function sendRateLimitResponse(int $retryAfter, int $limit, int $window): void {
        http_response_code(429);
        header("Retry-After: $retryAfter");
        header("X-RateLimit-Limit: $limit");
        header("X-RateLimit-Window: $window");

        echo json_encode([
            'error' => 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
            'retry_after' => $retryAfter,
            'limit' => $limit,
            'window' => $window
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Cleanup old rate limit files
     */
    private static function cleanup(): void {
        $files = glob(self::STORAGE_PATH . '*.txt');
        if (!$files) return;

        $now = time();
        $maxAge = 3600; // Delete files older than 1 hour

        foreach ($files as $file) {
            if (is_file($file) && ($now - filemtime($file)) > $maxAge) {
                @unlink($file);
            }
        }
    }

    /**
     * Clear rate limits for a specific IP and type (for testing/debugging)
     */
    public static function clear(string $type = 'general', ?string $ip = null): void {
        $ip = $ip ?? self::getClientIp();
        $filename = self::STORAGE_PATH . self::sanitizeFilename($ip . '_' . $type);

        if (file_exists($filename)) {
            @unlink($filename);
        }
    }

    /**
     * Get current rate limit status for debugging
     */
    public static function getStatus(string $type = 'general', ?string $ip = null): array {
        $ip = $ip ?? self::getClientIp();

        if (!isset(self::LIMITS[$type])) {
            $type = 'general';
        }
        [$maxAttempts, $windowSeconds] = self::LIMITS[$type];

        $filename = self::STORAGE_PATH . self::sanitizeFilename($ip . '_' . $type);
        $attempts = self::readAttempts($filename);

        // Clean old attempts
        $now = time();
        $cutoff = $now - $windowSeconds;
        $attempts = array_filter($attempts, fn($timestamp) => $timestamp > $cutoff);

        return [
            'ip' => $ip,
            'type' => $type,
            'current_attempts' => count($attempts),
            'max_attempts' => $maxAttempts,
            'window_seconds' => $windowSeconds,
            'remaining' => max(0, $maxAttempts - count($attempts)),
            'reset_in' => count($attempts) > 0 ? $windowSeconds - ($now - min($attempts)) : 0
        ];
    }
}
