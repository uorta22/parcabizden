<?php
require_once __DIR__ . '/config.php';

/**
 * MySQL bağlantısı — auth, users, garage tabloları için
 */
class Database {
    private static ?PDO $instance = null;

    public static function getInstance(): PDO {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 5,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_turkish_ci"
            ];

            self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
        }

        return self::$instance;
    }

    public static function query(string $sql, array $params = []): \PDOStatement {
        $stmt = self::getInstance()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function fetchAll(string $sql, array $params = []): array {
        return self::query($sql, $params)->fetchAll();
    }

    public static function fetchOne(string $sql, array $params = []): ?array {
        $result = self::query($sql, $params)->fetch();
        return $result ?: null;
    }

    public static function insert(string $sql, array $params = []): string {
        self::query($sql, $params);
        return self::getInstance()->lastInsertId();
    }

    public static function count(string $sql, array $params = []): int {
        return (int) self::query($sql, $params)->fetchColumn();
    }
}

/**
 * SQLite bağlantısı — parcabizden_v3.db katalog veritabanı
 * manufacturers, models, vehicles, categories, parts, suppliers
 */
class CatalogDB {
    private static ?PDO $instance = null;

    public static function isAvailable(): bool {
        return file_exists(CATALOG_DB_PATH);
    }

    public static function getInstance(): PDO {
        if (self::$instance === null) {
            $dbPath = CATALOG_DB_PATH;
            if (!file_exists($dbPath)) {
                throw new Exception('Katalog veritabanı bulunamadı: ' . $dbPath);
            }

            self::$instance = new PDO('sqlite:' . $dbPath, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);

            // SQLite performans ayarları
            self::$instance->exec('PRAGMA journal_mode = WAL');
            self::$instance->exec('PRAGMA cache_size = -64000'); // 64MB cache
            self::$instance->exec('PRAGMA mmap_size = 268435456'); // 256MB mmap
            self::$instance->exec('PRAGMA temp_store = MEMORY');
        }

        return self::$instance;
    }

    public static function query(string $sql, array $params = []): \PDOStatement {
        $stmt = self::getInstance()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function fetchAll(string $sql, array $params = []): array {
        return self::query($sql, $params)->fetchAll();
    }

    public static function fetchOne(string $sql, array $params = []): ?array {
        $result = self::query($sql, $params)->fetch();
        return $result ?: null;
    }

    public static function count(string $sql, array $params = []): int {
        return (int) self::query($sql, $params)->fetchColumn();
    }
}
