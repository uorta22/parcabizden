<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/rate_limit.php';

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove /api/ prefix
$path = preg_replace('#^/api/?#', '', $uri);
$path = trim($path, '/');
$segments = $path ? explode('/', $path) : [];

// Route requests
try {
    switch ($segments[0] ?? '') {
        case 'brands':
            RateLimiter::check('general');
            require __DIR__ . '/endpoints/brands.php';
            break;

        case 'models':
            RateLimiter::check('general');
            require __DIR__ . '/endpoints/models.php';
            break;

        case 'segments':
            RateLimiter::check('general');
            require __DIR__ . '/endpoints/segments.php';
            break;

        case 'years':
            RateLimiter::check('general');
            require __DIR__ . '/endpoints/years.php';
            break;

        case 'parts':
            RateLimiter::check('general');
            require __DIR__ . '/endpoints/parts.php';
            break;

        case 'categories':
            RateLimiter::check('general');
            require __DIR__ . '/endpoints/categories.php';
            break;

        case 'search':
            RateLimiter::check('search');
            require __DIR__ . '/endpoints/search.php';
            break;

        case 'vehicle-detail':
            RateLimiter::check('general');
            require __DIR__ . '/endpoints/vehicle-detail.php';
            break;

        case 'cross-ref':
            RateLimiter::check('general');
            require __DIR__ . '/endpoints/cross-ref.php';
            break;

        case 'auth':
            RateLimiter::check('auth');
            $action = $segments[1] ?? '';
            switch ($action) {
                case 'register':
                    require __DIR__ . '/endpoints/auth/register.php';
                    break;
                case 'login':
                    require __DIR__ . '/endpoints/auth/login.php';
                    break;
                case 'profile':
                    require __DIR__ . '/endpoints/auth/profile.php';
                    break;
                default:
                    jsonResponse(['error' => 'Auth endpoint bulunamadı'], 404);
            }
            break;

        case 'garage':
            RateLimiter::check('general');
            $action = $segments[1] ?? 'list';
            switch ($action) {
                case 'list':
                    require __DIR__ . '/endpoints/garage/list.php';
                    break;
                case 'add':
                    require __DIR__ . '/endpoints/garage/add.php';
                    break;
                case 'remove':
                    require __DIR__ . '/endpoints/garage/remove.php';
                    break;
                default:
                    jsonResponse(['error' => 'Garage endpoint bulunamadı'], 404);
            }
            break;

        case '':
            jsonResponse([
                'name' => 'ParcaBizden API',
                'version' => API_VERSION,
                'status' => 'ok'
            ]);
            break;

        default:
            jsonResponse(['error' => 'Endpoint bulunamadı'], 404);
    }
} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    jsonResponse(['error' => 'Veritabanı hatası oluştu'], 500);
} catch (Exception $e) {
    error_log('Server error: ' . $e->getMessage());
    jsonResponse(['error' => 'Sunucu hatası oluştu'], 500);
}
