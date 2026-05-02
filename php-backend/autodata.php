<?php
/**
 * autodata.php — Autodata araç veri tabanı fonksiyonları
 * handle_vehicle_specs, handle_autodata_brands, handle_autodata_models,
 * handle_autodata_generations, handle_autodata_resolve_slug,
 * normalize_cyrillic, catalog_brand_to_slug, catalog_resolve_brand,
 * autodata_resolve_brand_name
 *
 * Bağımlılık: catalog.php (format_gen_slug)
 */

// ==================== Vehicle Specs Handler ====================

function handle_vehicle_specs($pdo) {
    // Direct ID lookup — fastest path when spec_id is known
    $spec_id = isset($_GET['spec_id']) && $_GET['spec_id'] !== '' ? intval($_GET['spec_id']) : null;
    if ($spec_id) {
        try {
            $stmt = $pdo->prepare('SELECT id, brand, model, generation, modification, year_start, year_end, body_type, fuel_type, engine_cc, cylinders, power_hp, torque_nm, transmission, drivetrain, top_speed_kmh, accel_0_100, fuel_combined, length_mm, width_mm, height_mm, wheelbase_mm, weight_kg, trunk_liters, fuel_tank_liters, doors, seats FROM vehicle_specs WHERE id = :id');
            $stmt->execute([':id' => $spec_id]);
            $spec = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($spec) {
                $spec['id'] = (int)$spec['id'];
                foreach (['year_start','year_end','engine_cc','cylinders','length_mm','width_mm','height_mm','wheelbase_mm','doors','seats'] as $k) { $spec[$k] = $spec[$k] !== null ? (int)$spec[$k] : null; }
                foreach (['power_hp','torque_nm','top_speed_kmh','accel_0_100','fuel_combined','weight_kg','trunk_liters','fuel_tank_liters'] as $k) { $spec[$k] = $spec[$k] !== null ? (float)$spec[$k] : null; }

                // Also fetch sibling specs (same brand+model+generation)
                $siblings = $pdo->prepare('SELECT id, brand, model, generation, modification, year_start, year_end, body_type, fuel_type, engine_cc, cylinders, power_hp, torque_nm, transmission, drivetrain, top_speed_kmh, accel_0_100, fuel_combined, length_mm, width_mm, height_mm, wheelbase_mm, weight_kg, trunk_liters, fuel_tank_liters, doors, seats FROM vehicle_specs WHERE brand = :brand AND model = :model AND generation = :gen ORDER BY modification');
                $siblings->execute([':brand' => $spec['brand'], ':model' => $spec['model'], ':gen' => $spec['generation']]);
                $all_specs = $siblings->fetchAll(PDO::FETCH_ASSOC);
                foreach ($all_specs as &$s) {
                    $s['id'] = (int)$s['id'];
                    foreach (['year_start','year_end','engine_cc','cylinders','length_mm','width_mm','height_mm','wheelbase_mm','doors','seats'] as $k) { $s[$k] = $s[$k] !== null ? (int)$s[$k] : null; }
                    foreach (['power_hp','torque_nm','top_speed_kmh','accel_0_100','fuel_combined','weight_kg','trunk_liters','fuel_tank_liters'] as $k) { $s[$k] = $s[$k] !== null ? (float)$s[$k] : null; }
                }
                echo json_encode(['specs' => $all_specs, 'models' => [], 'brand' => $spec['brand']]);
                return;
            }
        } catch (PDOException $e) {}
    }

    $brand_slug = trim($_GET['brand'] ?? '');
    if (!$brand_slug) { echo json_encode(['error' => 'brand parametresi gerekli']); return; }

    $generation = trim($_GET['generation'] ?? '');
    $year = isset($_GET['year']) && $_GET['year'] !== '' ? intval($_GET['year']) : null;
    $model_filter = trim($_GET['model'] ?? '');

    // Brand slug → autodata brand name map
    $brand_map = [
        'audi' => 'Audi', 'bmw' => 'BMW', 'volkswagen' => 'Volkswagen',
        'mercedes-benz' => 'Mercedes-Benz', 'skoda' => 'Skoda', 'seat' => 'SEAT',
        'porsche' => 'Porsche', 'volvo' => 'Volvo', 'toyota' => 'Toyota',
        'nissan' => 'Nissan', 'honda' => 'Honda', 'hyundai' => 'Hyundai',
        'kia' => 'Kia', 'ford' => 'Ford', 'renault' => 'Renault',
        'peugeot' => 'Peugeot', 'citroen' => 'Citroen', 'fiat' => 'Fiat',
        'opel' => 'Opel', 'mazda' => 'Mazda', 'subaru' => 'Subaru',
        'suzuki' => 'Suzuki', 'mitsubishi' => 'Mitsubishi', 'chevrolet' => 'Chevrolet',
        'dacia' => 'Dacia', 'mini' => 'MINI', 'alfa-romeo' => 'Alfa Romeo',
        'land-rover' => 'Land Rover', 'jaguar' => 'Jaguar', 'lexus' => 'Lexus',
        'infiniti' => 'Infiniti', 'cupra' => 'Cupra', 'ds' => 'DS',
        'genesis' => 'Genesis', 'tesla' => 'Tesla', 'ferrari' => 'Ferrari',
        'lamborghini' => 'Lamborghini', 'maserati' => 'Maserati',
        'bentley' => 'Bentley', 'aston-martin' => 'Aston Martin',
        'rolls-royce' => 'Rolls-Royce', 'bugatti' => 'Bugatti',
        'abarth' => 'Fiat', 'lancia' => 'Lancia',
    ];

    $brand_name = isset($brand_map[$brand_slug]) ? $brand_map[$brand_slug] : ucfirst($brand_slug);

    // Build query
    $where = ['brand = :brand'];
    $params = [':brand' => $brand_name];

    // Generation fuzzy match — multi-strategy
    if ($generation) {
        // 1. Extract model name (text before parenthesis): "Octavia (NX3)" → "Octavia"
        $model_name = trim(preg_replace('/\s*\(.*$/', '', $generation));

        // 2. Extract platform code from parentheses: "(E90)" → "E90", "(NX3)" → "NX3"
        $platform_code = null;
        if (preg_match('/\(([A-Z0-9]+)\)/i', $generation, $m)) {
            $platform_code = strtoupper($m[1]);
        }

        // 3. Try platform code in autodata generation first
        $gen_conditions = [];
        if ($platform_code) {
            $gen_conditions[] = 'generation LIKE :gen_platform';
            $params[':gen_platform'] = '%' . $platform_code . '%';
        }

        // 4. Also try model name match (most reliable fallback)
        if ($model_name) {
            $gen_conditions[] = 'model LIKE :gen_model';
            $params[':gen_model'] = '%' . $model_name . '%';
        }

        // 5. Also try full generation string
        $gen_conditions[] = 'generation LIKE :gen_full';
        $params[':gen_full'] = '%' . $generation . '%';

        if (!empty($gen_conditions)) {
            $where[] = '(' . implode(' OR ', $gen_conditions) . ')';
        }
    }

    if ($model_filter) {
        $where[] = 'model LIKE :model_pattern';
        $params[':model_pattern'] = '%' . $model_filter . '%';
    }

    if ($year) {
        $where[] = '(year_start <= :year AND (year_end IS NULL OR year_end >= :year2))';
        $params[':year'] = $year;
        $params[':year2'] = $year;
    }

    $sql = 'SELECT id, brand, model, generation, modification, year_start, year_end, body_type, fuel_type, engine_cc, cylinders, power_hp, torque_nm, transmission, drivetrain, top_speed_kmh, accel_0_100, fuel_combined, length_mm, width_mm, height_mm, wheelbase_mm, weight_kg, trunk_liters, fuel_tank_liters, doors, seats FROM vehicle_specs WHERE ' . implode(' AND ', $where) . ' ORDER BY model, generation, modification LIMIT 200';

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $specs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Cast numeric fields
        foreach ($specs as &$s) {
            $s['id'] = (int)$s['id'];
            $s['year_start'] = $s['year_start'] !== null ? (int)$s['year_start'] : null;
            $s['year_end'] = $s['year_end'] !== null ? (int)$s['year_end'] : null;
            $s['engine_cc'] = $s['engine_cc'] !== null ? (int)$s['engine_cc'] : null;
            $s['cylinders'] = $s['cylinders'] !== null ? (int)$s['cylinders'] : null;
            $s['power_hp'] = $s['power_hp'] !== null ? (float)$s['power_hp'] : null;
            $s['torque_nm'] = $s['torque_nm'] !== null ? (float)$s['torque_nm'] : null;
            $s['top_speed_kmh'] = $s['top_speed_kmh'] !== null ? (float)$s['top_speed_kmh'] : null;
            $s['accel_0_100'] = $s['accel_0_100'] !== null ? (float)$s['accel_0_100'] : null;
            $s['fuel_combined'] = $s['fuel_combined'] !== null ? (float)$s['fuel_combined'] : null;
            $s['length_mm'] = $s['length_mm'] !== null ? (int)$s['length_mm'] : null;
            $s['width_mm'] = $s['width_mm'] !== null ? (int)$s['width_mm'] : null;
            $s['height_mm'] = $s['height_mm'] !== null ? (int)$s['height_mm'] : null;
            $s['wheelbase_mm'] = $s['wheelbase_mm'] !== null ? (int)$s['wheelbase_mm'] : null;
            $s['weight_kg'] = $s['weight_kg'] !== null ? (float)$s['weight_kg'] : null;
            $s['trunk_liters'] = $s['trunk_liters'] !== null ? (float)$s['trunk_liters'] : null;
            $s['fuel_tank_liters'] = $s['fuel_tank_liters'] !== null ? (float)$s['fuel_tank_liters'] : null;
            $s['doors'] = $s['doors'] !== null ? (int)$s['doors'] : null;
            $s['seats'] = $s['seats'] !== null ? (int)$s['seats'] : null;
        }

        // Also fetch distinct models+generations for this brand (for the picker)
        $models_sql = 'SELECT DISTINCT model, generation, COUNT(*) as mod_count FROM vehicle_specs WHERE brand = :brand GROUP BY model, generation ORDER BY model, generation';
        $mstmt = $pdo->prepare($models_sql);
        $mstmt->execute([':brand' => $brand_name]);
        $models = $mstmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($models as &$m) { $m['mod_count'] = (int)$m['mod_count']; }

        echo json_encode(['specs' => $specs, 'models' => $models, 'brand' => $brand_name]);
    } catch (PDOException $e) {
        // Table might not exist yet
        echo json_encode(['specs' => [], 'models' => [], 'brand' => $brand_name, 'note' => 'vehicle_specs tablosu henuz yuklu degil']);
    }
}

// ==================== Autodata Handlers ====================

function handle_autodata_brands($pdo) {
    try {
        // catalog_manufacturers + catalog_models'dan marka listesi
        $stmt = $pdo->query("
            SELECT m.name AS brand, COUNT(DISTINCT mo.id) AS model_count, COUNT(DISTINCT v.id) AS total
            FROM catalog_manufacturers m
            LEFT JOIN catalog_models mo ON mo.manufacturer_id = m.id
            LEFT JOIN catalog_vehicles v ON v.model_id = mo.id
            GROUP BY m.id, m.name
            ORDER BY m.name
        ");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $brands = [];
        foreach ($rows as $r) {
            $slug = catalog_brand_to_slug($r['brand']);
            $brands[] = [
                'name' => $r['brand'],
                'slug' => $slug,
                'model_count' => (int)$r['model_count'],
                'total' => (int)$r['total'],
            ];
        }
        echo json_encode(['brands' => $brands]);
    } catch (PDOException $e) {
        // Fallback: vehicle_specs tablosundan oku
        try {
            $stmt = $pdo->query("SELECT brand, COUNT(DISTINCT model) as model_count, COUNT(*) as total FROM vehicle_specs GROUP BY brand ORDER BY brand");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $brands = [];
            foreach ($rows as $r) {
                $slug = strtolower(trim($r['brand']));
                $slug = preg_replace('/\s+/', '-', $slug);
                $brands[] = ['name' => $r['brand'], 'slug' => $slug, 'model_count' => (int)$r['model_count'], 'total' => (int)$r['total']];
            }
            echo json_encode(['brands' => $brands]);
        } catch (PDOException $e2) {
            echo json_encode(['brands' => [], 'error' => 'Tablo bulunamadi']);
        }
    }
}

// Model adından base model çıkar
// Örn: "A3 Cabriolet (8P7)" → "A3"
// Örn: "A4 Allroad (8KH, B8)" → "A4"
// Örn: "OCTAVIA III (5E3)" → "OCTAVIA"
// Örn: "FABIA I Combi (6Y5)" → "FABIA"
// Örn: "SUPERB III Station Wagon (3V5)" → "SUPERB"
function extract_base_model(string $name): string {
    // 1. Parantez içini kaldır
    $clean = preg_replace('/\s*\(.*\)\s*$/', '', trim($name));

    // 2. Yapışık romen rakamlarını ayır (ör: "OCTAVIAII" → "OCTAVIA II")
    $clean = preg_replace('/((?:VIII|VII|VI|IV|V|III|II|I))$/', ' $1', $clean);

    // 3. Romen rakamlarını kaldır (en uzun eşleşme önce)
    $clean = preg_replace('/\b(VIII|VII|VI|IV|V|III|II|I)\b/', '', $clean);
    $clean = preg_replace('/\s{2,}/', ' ', trim($clean));

    // 3. Kasa tipi / varyant kelimelerini kaldır
    $bodyWords = [
        'Sedan','Avant','Sportback','Cabriolet','Cabrio','Limousine','Coupe','Coupé',
        'Hatchback','Wagon','Estate','Van','Chassis','Variant','Convertible','Roadster',
        'Spider','Spyder','Touring','Break','Berline','Cab','Pickup','Pick-up',
        'Kombi','Panorama','Cross','Crossback','Tourer','Countryman','Clubman','Paceman',
        'Crossover','MPV','SUV','Targa','Speedster','Turismo',
        'Allroad','Station','Combi','Praktik','Forman','Spaceback',
        'SW','CC','GT','GTE','GTI','RS','ST','Sport','Plus','Pro','Long',
        'Gran','Grand',
    ];

    $parts = explode(' ', $clean);
    $base = [];
    foreach ($parts as $p) {
        if (in_array($p, $bodyWords)) break; // İlk body word'de dur
        $base[] = $p;
    }

    $result = implode(' ', $base);
    return $result ?: $parts[0]; // Boş kalırsa ilk kelimeyi kullan
}

// Modelleri base name'e göre grupla
function group_models(array $rawModels): array {
    $groups = [];
    foreach ($rawModels as $r) {
        // 0 nesilli modelleri atla
        if ((int)$r['gen_count'] === 0) continue;

        $base = extract_base_model($r['model']);
        if (!isset($groups[$base])) {
            $groups[$base] = [
                'name' => $base,
                'sub_models' => [],
                'gen_count' => 0,
                'min_year' => null,
                'max_year' => null,
            ];
        }
        $g = &$groups[$base];
        $g['sub_models'][] = $r['model'];
        $g['gen_count'] += (int)$r['gen_count'];
        $minY = $r['min_year'] !== null ? (int)$r['min_year'] : null;
        $maxY = $r['max_year'] !== null ? (int)$r['max_year'] : null;
        if ($minY !== null && ($g['min_year'] === null || $minY < $g['min_year'])) $g['min_year'] = $minY;
        if ($maxY !== null && ($g['max_year'] === null || $maxY > $g['max_year'])) $g['max_year'] = $maxY;
    }

    // sub_models tek elemanlıysa gereksiz — sadece çoklu olanları tut
    $result = [];
    $seen = [];
    foreach ($groups as $g) {
        // Duplikasyon kontrolü (unicode/encoding farklılıklarına karşı)
        $key = mb_strtolower($g['name']);
        if (isset($seen[$key])) continue;
        $seen[$key] = true;

        if (count($g['sub_models']) === 1) {
            // Tek varyant — temizlenmiş base ismi kullan (parantez ve kod olmadan)
            $result[] = [
                'name' => $g['name'],
                'gen_count' => $g['gen_count'],
                'min_year' => $g['min_year'],
                'max_year' => $g['max_year'],
                'sub_models' => $g['sub_models'],
            ];
        } else {
            // Çoklu varyant — base model altında grupla
            $result[] = [
                'name' => $g['name'],
                'gen_count' => $g['gen_count'],
                'min_year' => $g['min_year'],
                'max_year' => $g['max_year'],
                'sub_models' => $g['sub_models'],
            ];
        }
    }

    // İsme göre sırala
    usort($result, fn($a, $b) => strnatcasecmp($a['name'], $b['name']));
    return $result;
}

function handle_autodata_models($pdo) {
    $brand_slug = trim($_GET['brand'] ?? '');
    if (!$brand_slug) { echo json_encode(['error' => 'brand parametresi gerekli']); return; }

    // catalog_manufacturers'dan marka bul
    $brand_name = catalog_resolve_brand($pdo, $brand_slug);
    if (!$brand_name) { echo json_encode(['models' => []]); return; }

    try {
        $stmt = $pdo->prepare("
            SELECT mo.name AS model,
                   COUNT(DISTINCT v.id) AS gen_count,
                   MIN(v.year_from) AS min_year,
                   MAX(COALESCE(v.year_to, 2025)) AS max_year
            FROM catalog_models mo
            JOIN catalog_manufacturers m ON mo.manufacturer_id = m.id
            LEFT JOIN catalog_vehicles v ON v.model_id = mo.id
            WHERE m.name = :brand
            GROUP BY mo.id, mo.name
            ORDER BY mo.name
        ");
        $stmt->execute([':brand' => $brand_name]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $models = group_models($rows);
        echo json_encode(['models' => $models, 'brand' => $brand_name]);
    } catch (PDOException $e) {
        // Fallback: vehicle_specs
        $brand_name_fb = autodata_resolve_brand_name($pdo, $brand_slug);
        if (!$brand_name_fb) { echo json_encode(['models' => []]); return; }
        try {
            $stmt = $pdo->prepare("SELECT DISTINCT model, COUNT(DISTINCT generation) as gen_count, MIN(year_start) as min_year, MAX(COALESCE(year_end, 2025)) as max_year FROM vehicle_specs WHERE brand = :brand GROUP BY model ORDER BY model");
            $stmt->execute([':brand' => $brand_name_fb]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $models = group_models($rows);
            echo json_encode(['models' => $models, 'brand' => $brand_name_fb]);
        } catch (PDOException $e2) {
            echo json_encode(['models' => []]);
        }
    }
}

function handle_autodata_generations($pdo) {
    $brand_slug = trim($_GET['brand'] ?? '');
    $model = normalize_cyrillic(trim($_GET['model'] ?? ''));
    if (!$brand_slug || !$model) { echo json_encode(['error' => 'brand ve model parametreleri gerekli']); return; }

    $brand_name = catalog_resolve_brand($pdo, $brand_slug);
    if (!$brand_name) { echo json_encode(['generations' => []]); return; }

    try {
        // Gruplandırılmış model mi kontrol et — base name ile eşleşen tüm alt modelleri bul
        $modelStmt = $pdo->prepare("
            SELECT mo.name FROM catalog_models mo
            JOIN catalog_manufacturers m ON mo.manufacturer_id = m.id
            WHERE m.name = :brand
        ");
        $modelStmt->execute([':brand' => $brand_name]);
        $allModels = $modelStmt->fetchAll(PDO::FETCH_COLUMN);

        // Birebir eşleşme varsa direkt kullan, yoksa base model eşleşmesi
        $matchedModels = [];
        if (in_array($model, $allModels)) {
            $matchedModels = [$model];
        } else {
            // Base model eşleşmesi — bu model adıyla başlayan tüm alt modelleri bul
            foreach ($allModels as $m) {
                if (extract_base_model($m) === $model) {
                    $matchedModels[] = $m;
                }
            }
        }

        if (empty($matchedModels)) {
            echo json_encode(['generations' => []]);
            return;
        }

        // catalog_vehicles gruplama — eşleşen tüm modellerin nesilleri
        $placeholders = implode(',', array_fill(0, count($matchedModels), '?'));
        $stmt = $pdo->prepare("
            SELECT v.description AS generation,
                   MIN(v.year_from) AS year_start,
                   MAX(v.year_to) AS year_end,
                   NULL AS body_type,
                   COUNT(*) AS mod_count
            FROM catalog_vehicles v
            JOIN catalog_models mo ON v.model_id = mo.id
            JOIN catalog_manufacturers m ON mo.manufacturer_id = m.id
            WHERE m.name = ? AND mo.name IN ($placeholders)
            GROUP BY v.description
            ORDER BY MIN(v.year_from) DESC, v.description
        ");
        $stmt->execute(array_merge([$brand_name], $matchedModels));
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $generations = [];
        foreach ($rows as $r) {
            $generations[] = [
                'name' => $r['generation'],
                'year_start' => $r['year_start'] !== null ? (int)$r['year_start'] : null,
                'year_end' => $r['year_end'] !== null ? (int)$r['year_end'] : null,
                'body_type' => $r['body_type'],
                'mod_count' => (int)$r['mod_count'],
            ];
        }
        echo json_encode(['generations' => $generations]);
    } catch (PDOException $e) {
        // Fallback: vehicle_specs
        $brand_name_fb = autodata_resolve_brand_name($pdo, $brand_slug);
        if (!$brand_name_fb) { echo json_encode(['generations' => []]); return; }
        try {
            $stmt = $pdo->prepare("SELECT DISTINCT generation, MIN(year_start) as year_start, MAX(year_end) as year_end, body_type, COUNT(*) as mod_count FROM vehicle_specs WHERE brand = :brand AND model = :model GROUP BY generation, body_type ORDER BY MIN(year_start) DESC");
            $stmt->execute([':brand' => $brand_name_fb, ':model' => $model]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $generations = [];
            foreach ($rows as $r) {
                $generations[] = ['name' => $r['generation'], 'year_start' => $r['year_start'] !== null ? (int)$r['year_start'] : null, 'year_end' => $r['year_end'] !== null ? (int)$r['year_end'] : null, 'body_type' => $r['body_type'], 'mod_count' => (int)$r['mod_count']];
            }
            echo json_encode(['generations' => $generations]);
        } catch (PDOException $e2) {
            echo json_encode(['generations' => []]);
        }
    }
}

function handle_autodata_resolve_slug($pdo) {
    $brand_slug = trim($_GET['brand'] ?? '');
    $model = normalize_cyrillic(trim($_GET['model'] ?? ''));
    $generation = normalize_cyrillic(trim($_GET['generation'] ?? ''));
    if (!$brand_slug) { echo json_encode(['error' => 'brand parametresi gerekli']); return; }

    // Get all generation slugs for this brand from parts DB
    try {
        $stmt = $pdo->prepare("SELECT DISTINCT generation_slug, COUNT(DISTINCT oem_number) as part_count FROM parts WHERE brand_slug = :brand GROUP BY generation_slug");
        $stmt->execute([':brand' => $brand_slug]);
        $db_gens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        echo json_encode(['matches' => [], 'auto_selected' => null]);
        return;
    }

    if (empty($db_gens)) {
        echo json_encode(['matches' => [], 'auto_selected' => null]);
        return;
    }

    // Extract platform code from generation: "3 Series (E90)" → "E90"
    $platform_code = null;
    if ($generation && preg_match('/\(([A-Z0-9]+)\)/i', $generation, $m)) {
        $platform_code = strtoupper($m[1]);
    }

    // Extract model name from generation: "3 Series (E90)" → "3 Series"
    // Also strip Roman numerals at the end: "Sandero III" → "Sandero"
    $gen_model_name = $generation ? trim(preg_replace('/\s*\(.*$/', '', $generation)) : '';
    $gen_model_base = trim(preg_replace('/\s+(I{1,3}|IV|V|VI{0,3})$/i', '', $gen_model_name));

    // Normalize for matching
    $model_lower = strtolower($model ?: $gen_model_name);
    $model_slug = str_replace(' ', '-', $model_lower);
    $model_base_lower = strtolower($gen_model_base ?: $model_lower);
    $model_base_slug = str_replace(' ', '-', $model_base_lower);

    // Extract year from generation if present
    $year = isset($_GET['year']) && $_GET['year'] !== '' ? intval($_GET['year']) : null;

    $matches = [];
    foreach ($db_gens as $g) {
        $slug = $g['generation_slug'];
        $slug_lower = strtolower($slug);
        $score = 0;

        // Strategy 1: Platform code match (highest priority)
        if ($platform_code && stripos($slug, $platform_code) !== false) {
            $score += 100;
        }

        // Strategy 2: Exact model name match in slug
        if ($model_slug && (strpos($slug_lower, $model_slug) !== false || strpos($slug_lower, $model_lower) !== false)) {
            $score += 50;
        }

        // Strategy 3: Base model name match (without Roman numerals)
        // e.g. "sandero" matches "sandero_sandero-06-2008"
        if ($model_base_slug && $model_base_slug !== $model_slug && strpos($slug_lower, $model_base_slug) !== false) {
            $score += 40;
        }

        // Strategy 4: Partial model word match
        if ($model_lower) {
            $model_words = array_merge(explode(' ', $model_lower), explode('-', $model_slug));
            $model_words = array_unique($model_words);
            foreach ($model_words as $word) {
                $word = trim($word);
                if (strlen($word) >= 3 && strpos($slug_lower, $word) !== false) {
                    $score += 10;
                }
            }
        }

        // Strategy 5: Year range matching from slug
        if ($year && $score > 0) {
            // Try to extract year from slug like "sandero-06-2008" or "sandero-2020"
            if (preg_match('/(\d{4})/', $slug, $ym)) {
                $slug_year = (int)$ym[1];
                if ($slug_year > 1980 && $slug_year < 2030) {
                    if ($year >= $slug_year && $year <= $slug_year + 10) {
                        $score += 20; // Year range bonus
                    }
                }
            }
        }

        if ($score > 0) {
            $matches[] = [
                'generation_slug' => $slug,
                'generation_name' => format_gen_slug($slug),
                'part_count' => (int)$g['part_count'],
                'score' => $score,
            ];
        }
    }

    // Sort by score desc, then part_count desc
    usort($matches, function($a, $b) {
        if ($a['score'] !== $b['score']) return $b['score'] - $a['score'];
        return $b['part_count'] - $a['part_count'];
    });

    // Remove score from output
    $output = [];
    foreach ($matches as $m) {
        unset($m['score']);
        $output[] = $m;
    }

    $auto_selected = !empty($output) ? $output[0]['generation_slug'] : null;

    // Fallback sadece: hem score=0 hem de model adı DB'de hiç geçmiyorsa fallback verme.
    // Model slug DB'de geçiyorsa ama generation eşleşmiyorsa marka'nın tüm nesilleri göster.
    if (empty($output) && !empty($db_gens) && $model_slug) {
        // Model adının DB'de var olup olmadığını kontrol et
        $model_exists_in_db = false;
        foreach ($db_gens as $g) {
            if (strpos(strtolower($g['generation_slug']), $model_base_slug) !== false ||
                strpos(strtolower($g['generation_slug']), $model_slug) !== false) {
                $model_exists_in_db = true;
                break;
            }
        }
        // Model DB'deyse ama generation eşleşmiyorsa → o modelin tüm nesilleri (yardımcı olabilir)
        if ($model_exists_in_db) {
            foreach ($db_gens as $g) {
                if (strpos(strtolower($g['generation_slug']), $model_base_slug) !== false ||
                    strpos(strtolower($g['generation_slug']), $model_slug) !== false) {
                    $output[] = [
                        'generation_slug' => $g['generation_slug'],
                        'generation_name' => format_gen_slug($g['generation_slug']),
                        'part_count' => (int)$g['part_count'],
                    ];
                }
            }
            usort($output, function($a, $b) { return $b['part_count'] - $a['part_count']; });
        }
        // Model DB'de yoksa → empty output → frontend no_parts gösterir (doğru davranış)
    }

    echo json_encode(['matches' => $output, 'auto_selected' => $auto_selected]);
}

/**
 * Kiril karakter içeren model isimlerini Latin karşılığına çevirir
 * Eski URL'lerde kalan Kiril metinlerin çalışmasını sağlar
 */
function normalize_cyrillic(string $text): string {
    // Compound ifadeler önce (sıra önemli)
    static $map = [
        'Наклонная задняя часть' => 'Hatchback',
        'Привод на все колеса' => 'AWD',
        'Привод на задние колеса' => 'RWD',
        'c бортовой платформой/ходовая часть' => 'Chassis Cab',
        'с бортовой платформой/ходовая часть' => 'Chassis Cab',
        'бортовой платформой' => 'Flatbed',
        'ходовая часть' => 'Chassis',
        'Одноосный тягач' => 'Tractor',
        'Кабриолет' => 'Cabriolet',
        'Автомобиль' => 'Car',
        'Самосвал' => 'Dump Truck',
        'вездеход' => 'SUV',
        'Вездеход' => 'SUV',
        'универсал' => 'Station Wagon',
        'хетчбэк' => 'Hatchback',
        'закрытый' => 'Closed',
        'открытый' => 'Open',
        'автобус' => 'Bus',
        'Фургон' => 'Van',
        'фургон' => 'Van',
        'бортовой' => 'Flatbed',
        'СЕДАН' => 'Sedan',
        'седан' => 'Sedan',
        'купе' => 'Coupe',
        'Пикап' => 'Pickup',
        'тягач' => 'Tractor',
        'тарга' => 'Targa',
        'Кузов' => 'Body',
        'вэн' => 'Van',
    ];
    return str_replace(array_keys($map), array_values($map), $text);
}

/**
 * Katalog marka adını frontend-uyumlu slug'a çevirir
 * VW → volkswagen, CITROËN → citroen, ALFA ROMEO → alfa-romeo
 */
function catalog_brand_to_slug(string $name): string {
    // Özel eşleştirmeler — slug'ın dosya adlarıyla uyumlu olması için
    static $slug_map = [
        'VW' => 'volkswagen',
        'CITROËN' => 'citroen',
        'ŠKODA' => 'skoda',
        'ŠVENTINĖ' => 'sventine',
        'VW (FAW)' => 'vw-faw',
        'VW (SVW)' => 'vw-svw',
        'CITROËN (DF-PSA)' => 'citroen-df-psa',
        'ŠKODA (SVW)' => 'skoda-svw',
    ];
    $upper = strtoupper(trim($name));
    if (isset($slug_map[$upper])) return $slug_map[$upper];

    $slug = strtolower(trim($name));
    // Diacritics temizle: Ë→e, É→e, Ö→o, Ü→u vb.
    $slug = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $slug) ?: $slug;
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug;
}

function catalog_resolve_brand($pdo, $brand_slug) {
    // Yaygın slug → katalog marka adı eşlemeleri
    static $alias_map = [
        'volkswagen' => 'VW',
        'citroen' => 'CITROËN',
        'mini' => 'MINI',
        'ds' => 'DS',
        'mg' => 'MG',
        'gmc' => 'GMC',
        'bmw' => 'BMW',
        'daf' => 'DAF',
        'man' => 'MAN',
        'nsu' => 'NSU',
        'alfa-romeo' => 'ALFA ROMEO',
        'aston-martin' => 'ASTON MARTIN',
        'land-rover' => 'LAND ROVER',
        'rolls-royce' => 'ROLLS-ROYCE',
        'mercedes-benz' => 'MERCEDES-BENZ',
    ];

    if (isset($alias_map[$brand_slug])) {
        return $alias_map[$brand_slug];
    }

    // catalog_manufacturers tablosundan slug ile marka adı bul
    try {
        $upper = strtoupper(str_replace('-', ' ', $brand_slug));
        $stmt = $pdo->prepare("SELECT name FROM catalog_manufacturers WHERE UPPER(name) = :upper LIMIT 1");
        $stmt->execute([':upper' => $upper]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) return $row['name'];

        // LIKE ile esnek arama
        $like = '%' . str_replace('-', '%', $brand_slug) . '%';
        $stmt = $pdo->prepare("SELECT name FROM catalog_manufacturers WHERE LOWER(name) LIKE LOWER(:like) LIMIT 1");
        $stmt->execute([':like' => $like]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) return $row['name'];
    } catch (PDOException $e) {
        // catalog tablosu yoksa null dön
    }
    return null;
}

function autodata_resolve_brand_name($pdo, $brand_slug) {
    // Map of slug → autodata brand name
    $brand_map = [
        'audi' => 'Audi', 'bmw' => 'BMW', 'volkswagen' => 'Volkswagen',
        'mercedes-benz' => 'Mercedes-Benz', 'skoda' => 'Skoda', 'seat' => 'SEAT',
        'porsche' => 'Porsche', 'volvo' => 'Volvo', 'toyota' => 'Toyota',
        'nissan' => 'Nissan', 'honda' => 'Honda', 'hyundai' => 'Hyundai',
        'kia' => 'Kia', 'ford' => 'Ford', 'renault' => 'Renault',
        'peugeot' => 'Peugeot', 'citroen' => 'Citroen', 'fiat' => 'Fiat',
        'opel' => 'Opel', 'mazda' => 'Mazda', 'subaru' => 'Subaru',
        'suzuki' => 'Suzuki', 'mitsubishi' => 'Mitsubishi', 'chevrolet' => 'Chevrolet',
        'dacia' => 'Dacia', 'mini' => 'MINI', 'alfa-romeo' => 'Alfa Romeo',
        'land-rover' => 'Land Rover', 'jaguar' => 'Jaguar', 'lexus' => 'Lexus',
        'infiniti' => 'Infiniti', 'cupra' => 'Cupra', 'ds' => 'DS',
        'genesis' => 'Genesis', 'tesla' => 'Tesla', 'ferrari' => 'Ferrari',
        'lamborghini' => 'Lamborghini', 'maserati' => 'Maserati',
        'bentley' => 'Bentley', 'aston-martin' => 'Aston Martin',
        'rolls-royce' => 'Rolls-Royce', 'bugatti' => 'Bugatti',
        'abarth' => 'Fiat', 'lancia' => 'Lancia',
    ];

    if (isset($brand_map[$brand_slug])) return $brand_map[$brand_slug];

    // Fallback: try to find brand name from vehicle_specs directly
    try {
        $stmt = $pdo->prepare("SELECT DISTINCT brand FROM vehicle_specs WHERE LOWER(REPLACE(brand, ' ', '-')) = :slug LIMIT 1");
        $stmt->execute([':slug' => $brand_slug]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $row['brand'] : null;
    } catch (PDOException $e) {
        return ucfirst($brand_slug);
    }
}
