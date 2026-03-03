# ParcaBizden PHP Backend Kurulum Rehberi

## 1. Veritabani Migration

`migration.sql` dosyasini phpMyAdmin veya SSH uzerinden calistirin:

```bash
mysql -u kullanici -p veritabani_adi < migration.sql
```

Bu dosya:
- `products`, `orders`, `order_items`, `addresses`, `favorites` tablolarini olusturur
- `users` tablosuna yeni profil alanlarini ekler (gsm, address_line1, city vb.)

## 2. PHP Dosyalarini Dahil Etme

Mevcut `index.php` dosyanizda action router'a yeni action'lari ekleyin:

```php
<?php
// Mevcut index.php dosyanizin basinda
require_once 'products.php';
require_once 'orders.php';
require_once 'addresses.php';
require_once 'favorites.php';
require_once 'profile.php';
require_once 'password.php';

// ... mevcut kodlariniz ...

// Action router'da yeni case'ler ekleyin:
$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    // ... mevcut action'lar ...

    // Urunler (auth gerektirmez)
    case 'product_list':
        handleProductList($db);
        break;
    case 'product_detail':
        handleProductDetail($db);
        break;
    case 'product_search':
        handleProductSearch($db);
        break;

    // Profil (auth gerektirir)
    case 'profile':
        $userId = requireAuth();
        handleProfileGet($db, $userId);
        break;
    case 'profile_update':
        $userId = requireAuth();
        handleProfileUpdate($db, $userId);
        break;

    // Adresler (auth gerektirir)
    case 'address_list':
        $userId = requireAuth();
        handleAddressList($db, $userId);
        break;
    case 'address_add':
        $userId = requireAuth();
        handleAddressAdd($db, $userId);
        break;
    case 'address_update':
        $userId = requireAuth();
        handleAddressUpdate($db, $userId);
        break;
    case 'address_remove':
        $userId = requireAuth();
        handleAddressRemove($db, $userId);
        break;

    // Siparisler (auth gerektirir)
    case 'order_list':
        $userId = requireAuth();
        handleOrderList($db, $userId);
        break;
    case 'order_detail':
        $userId = requireAuth();
        handleOrderDetail($db, $userId);
        break;
    case 'order_create':
        $userId = requireAuth();
        handleOrderCreate($db, $userId);
        break;

    // Favoriler (auth gerektirir)
    case 'favorite_list':
        $userId = requireAuth();
        handleFavoriteList($db, $userId);
        break;
    case 'favorite_add':
        $userId = requireAuth();
        handleFavoriteAdd($db, $userId);
        break;
    case 'favorite_remove':
        $userId = requireAuth();
        handleFavoriteRemove($db, $userId);
        break;

    // Sifre & Hesap (auth gerektirir)
    case 'change_password':
        $userId = requireAuth();
        handleChangePassword($db, $userId);
        break;
    case 'delete_account':
        $userId = requireAuth();
        handleDeleteAccount($db, $userId);
        break;
}
```

## 3. Gerekli Helper Fonksiyonlar

Eger mevcut index.php'de yoksa su fonksiyonlari ekleyin:

```php
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function requireAuth() {
    // JWT token dogrulama
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$header || !preg_match('/Bearer\s+(.+)/', $header, $m)) {
        jsonResponse(['error' => 'Yetkilendirme gerekli'], 401);
    }
    $token = $m[1];
    // JWT decode & verify (mevcut JWT kutuphanenizi kullanin)
    $payload = decodeJWT($token); // Kendi implementasyonunuz
    if (!$payload || !isset($payload['sub'])) {
        jsonResponse(['error' => 'Gecersiz token'], 401);
    }
    return (int)$payload['sub'];
}

function getDB() {
    // PDO baglantisi (mevcut config'inizi kullanin)
    static $db = null;
    if (!$db) {
        $db = new PDO('mysql:host=localhost;dbname=VERITABANI;charset=utf8mb4', 'KULLANICI', 'SIFRE');
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }
    return $db;
}
```

## 4. Dosya Listesi

| Dosya | Aciklama |
|-------|----------|
| `migration.sql` | Veritabani tablolari + ALTER komutlari |
| `products.php` | product_list, product_detail, product_search |
| `orders.php` | order_list, order_detail, order_create |
| `addresses.php` | address_list, address_add, address_update, address_remove |
| `favorites.php` | favorite_list, favorite_add, favorite_remove |
| `profile.php` | profile (genisletilmis), profile_update |
| `password.php` | change_password, delete_account |

## 5. Notlar

- `favorites.php` icindeki `formatProduct()` fonksiyonu `products.php`'den gelir, ikisini birlikte dahil edin.
- Urun ekleme icin phpMyAdmin uzerinden `products` tablosuna veri girebilirsiniz.
- `vehicle_products` tablosu arac-urun uyumluluk eslestirmesi icin kullanilir (opsiyonel).
