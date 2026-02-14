<?php
/**
 * Vehicle database helper - reads from SQLite vehicles.db
 * Provides brand/model data without requiring MySQL setup
 */
class VehicleDB {
    private static ?PDO $instance = null;

    public static function getInstance(): PDO {
        if (self::$instance === null) {
            $dbPath = __DIR__ . '/vehicles.db';
            if (!file_exists($dbPath)) {
                throw new Exception('Vehicle database not found');
            }
            self::$instance = new PDO('sqlite:' . $dbPath, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        }
        return self::$instance;
    }

    public static function getBrands(bool $popular = false): array {
        $pdo = self::getInstance();
        // Map popular brands
        $popularBrands = [
            'Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Toyota', 'Ford', 'Renault',
            'Fiat', 'Hyundai', 'Kia', 'Peugeot', 'Opel', 'Honda', 'Nissan',
            'Skoda', 'Mazda', 'Citroen', 'Volvo', 'Seat', 'Dacia', 'Mitsubishi',
            'Subaru', 'Suzuki', 'Chevrolet'
        ];

        $brands = $pdo->query("SELECT id, name, slug FROM brands ORDER BY name ASC")->fetchAll();

        $logoMap = [
            'Mercedes' => 'mercedes-benz.png',
            'MINI' => 'mini.png',
            'MAN' => 'man.png',
            'Genesis' => 'genesis.jpg',
            'Lada' => 'lada.jpg',
        ];

        $result = [];
        foreach ($brands as $brand) {
            $isPop = in_array($brand['name'], $popularBrands);
            if ($popular && !$isPop) continue;

            $logoFile = $logoMap[$brand['name']] ?? ($brand['slug'] . '.png');
            $result[] = [
                'id' => (int)$brand['id'],
                'name' => $brand['name'],
                'logo_file' => $logoFile,
            ];
        }
        return $result;
    }

    public static function getModels(int $brandId): array {
        $pdo = self::getInstance();
        $stmt = $pdo->prepare(
            "SELECT id, model_name as name, body_type, image_path
             FROM models WHERE brand_id = :brand_id ORDER BY model_name ASC"
        );
        $stmt->execute(['brand_id' => $brandId]);
        $models = $stmt->fetchAll();

        return array_map(function($m) {
            return [
                'id' => (int)$m['id'],
                'name' => $m['name'],
                'body_type' => $m['body_type'],
                'image_path' => $m['image_path'] ? '/' . $m['image_path'] : null,
            ];
        }, $models);
    }

    public static function searchModels(string $query): array {
        $pdo = self::getInstance();
        $stmt = $pdo->prepare(
            "SELECT m.id, m.model_name as name, m.body_type, m.image_path,
                    b.name as brand_name, b.slug as brand_slug
             FROM models m
             JOIN brands b ON m.brand_id = b.id
             WHERE m.model_name LIKE :query OR b.name LIKE :query
             ORDER BY b.name, m.model_name
             LIMIT 50"
        );
        $searchTerm = '%' . $query . '%';
        $stmt->execute(['query' => $searchTerm]);
        return $stmt->fetchAll();
    }
}
