import { test, expect } from '@playwright/test'

/**
 * Üç yüzeyin ayrımı ve herkese açık API sözleşmeleri.
 *
 *   localhost:3000            → alıcı sitesi
 *   pazaryeri.localhost:3000  → satıcı paneli
 *   talep.localhost:3000      → talep yüzeyi
 *
 * Alt alan adları yerelde middleware üzerinden çözülüyor; üretimdeki
 * pazaryeri./talep. ile aynı kod yolunu kullanır.
 *
 * Buradaki testler oturum AÇMADAN çalışır — hesap oluşturmak ve şifre girmek
 * bu ortamda yapılamıyor. Giriş gerektiren akışlar (başvuru, ilan verme,
 * teklif) elle test edilmeli; sahte güvence vermesin diye kapsanmıyor.
 */

const BUYER = 'http://localhost:3000'
const SELLER = 'http://pazaryeri.localhost:3000'
const REQUEST = 'http://talep.localhost:3000'
const API = 'https://api.parcabizden.com.tr'

// ── Yüzey izolasyonu ──────────────────────────────────────────
// Panel yolları ana alan adından açılmamalı. Bu bir UX sınırı;
// gerçek yetkilendirme PHP tarafında.

for (const path of ['/pazaryeri', '/pazaryeri/ilanlarim', '/talep', '/talep/olustur']) {
  test(`ana alan adından ${path} açılmıyor`, async ({ request }) => {
    const response = await request.get(`${BUYER}${path}`)
    expect(response.status()).toBe(404)
  })
}

test('alıcı sitesi kendi kökünde çalışıyor', async ({ page }) => {
  await page.goto(BUYER)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Aracınıza özel yedek parçayı')
})

// ── Satıcı paneli ─────────────────────────────────────────────

test('satıcı paneli giriş yapmamış ziyaretçiye karşılama kapısı gösteriyor', async ({ page }) => {
  await page.goto(SELLER)

  await expect(page.getByRole('heading', { name: /Satıcı Paneline/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Giriş Yap' })).toBeVisible()
  expect(await page.title()).toContain('Pazaryeri')
})

test('satıcı girişi kendi yüzeyinde, alıcı girişinden ayrı', async ({ page }) => {
  await page.goto(`${SELLER}/giris`)
  await expect(page).toHaveURL(/pazaryeri\.localhost/)
  expect(page.url()).toContain('/giris')
})

test('mağaza başvurusu satıcı yüzeyinde açılıyor', async ({ page }) => {
  await page.goto(`${SELLER}/basvuru`)
  expect(page.url()).toContain('/basvuru')
})

// ── Talep yüzeyi ──────────────────────────────────────────────

/**
 * Talep açmak üyelik istemiyor — ürünün bilinçli farkı.
 * Referans platform (otodevi) talepten önce üyelik, adres ve TC Kimlik
 * istiyor; huni orada tıkanıyor. Bu test o kararı kilitliyor.
 */
test('talep yüzeyi giriş yapmamış ziyaretçiye açık, girişe yönlendirmiyor', async ({ page }) => {
  await page.goto(REQUEST)

  await expect(page).toHaveURL(/talep\.localhost/)
  expect(page.url()).not.toContain('/giris')
  expect(await page.title()).toContain('Talebi')
})

/**
 * Kök layout '%s | ParcaBizden' şablonu uyguluyor; yüzey layout'ları
 * başlığa site adını TEKRAR eklememeli. Bu hata daha önce /parcalar ve
 * /arac'ta çıkmıştı, iki yeni yüzeyde de aynen tekrarlandı.
 */
for (const [name, url] of [['satıcı paneli', SELLER], ['talep yüzeyi', REQUEST]] as const) {
  test(`${name} başlığında site adı tekrarlanmıyor`, async ({ page }) => {
    await page.goto(url)
    const title = await page.title()
    expect(title.split('ParcaBizden').length - 1).toBe(1)
  })
}

test('talep formu üyeliksiz erişilebilir', async ({ page }) => {
  await page.goto(`${REQUEST}/olustur`)

  expect(page.url()).not.toContain('/giris')
  await expect(page.getByLabel(/telefon/i).first()).toBeVisible()
})

// ── Herkese açık API sözleşmeleri ─────────────────────────────

test('ilan arama API sözleşmesi: sayfalama alanlarıyla dönüyor', async ({ request }) => {
  const response = await request.get(`${API}/?action=listing_search`)
  expect(response.status()).toBe(200)

  const body = await response.json()
  expect(Array.isArray(body.listings)).toBe(true)
  expect(typeof body.total).toBe('number')
  expect(typeof body.page).toBe('number')
  expect(typeof body.per_page).toBe('number')
})

test('geo_cities 81 ili döndürüyor', async ({ request }) => {
  const response = await request.get(`${API}/?action=geo_cities`)
  expect(response.status()).toBe(200)

  const body = await response.json()
  expect(Array.isArray(body.cities)).toBe(true)
  expect(body.cities.length).toBe(81)
})

test('satıcı endpointi oturumsuz istekte 401 döndürüyor', async ({ request }) => {
  const response = await request.get(`${API}/?action=seller_me`)
  expect(response.status()).toBe(401)
})

test('talep oluşturma endpointi yalnızca POST kabul ediyor', async ({ request }) => {
  const response = await request.get(`${API}/?action=request_create`)
  const body = await response.json()
  expect(body.error).toContain('POST')
})

test('talep detayı erişim anahtarı olmadan açılmıyor', async ({ request }) => {
  // Anahtarsız istek, talep var olsa bile bulunamadı dönmeli — id denemeyle
  // başkasının talebi ve telefonu okunabilmemeli.
  const response = await request.get(`${API}/?action=request_detail&id=1`)
  expect([400, 404]).toContain(response.status())
})
