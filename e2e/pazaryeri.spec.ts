import { test, expect } from '@playwright/test'

/**
 * Pazaryeri yüzeyi: satıcı ve ilan sayfalarının giriş kapıları + arama API'si.
 *
 * Buradaki testler oturum AÇMADAN çalışır — hesap oluşturmak ve şifre girmek
 * bu ortamda yapılamıyor. Dolayısıyla kapsanan şey, giriş yapmamış bir
 * ziyaretçinin gördüğü davranış: sayfalar açılıyor mu, doğru yönlendirme
 * yapılıyor mu, herkese açık API sözleşmesi bozulmuş mu.
 *
 * Giriş gerektiren akışlar (mağaza başvurusu, ilan oluşturma) elle test
 * edilmeli — burada kasıtlı olarak kapsanmıyor, sahte güvence vermesin.
 */

test('/magaza-ac açılıyor ve giriş yapmamış ziyaretçiye giriş kapısı gösteriyor', async ({ page }) => {
  await page.goto('/magaza-ac')

  await expect(page.getByRole('heading', { name: /giriş yapın/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Giriş Yap' }).first()).toBeVisible()

  // Kendi başlığı olmalı — anasayfanınkine düşmemeli.
  expect(await page.title()).toContain('Mağaza Aç')
})

test('/ilan-ver giriş yapmamış ziyaretçiyi girişe yönlendiriyor', async ({ page }) => {
  await page.goto('/ilan-ver')
  await page.waitForURL(/\/giris/)
  expect(page.url()).toContain('/giris')
})

test('ilan arama API sözleşmesi: sayfalama alanlarıyla birlikte dönüyor', async ({ request }) => {
  const response = await request.get('https://api.parcabizden.com.tr/?action=listing_search')
  expect(response.status()).toBe(200)

  const body = await response.json()
  expect(Array.isArray(body.listings)).toBe(true)
  expect(typeof body.total).toBe('number')
  expect(typeof body.page).toBe('number')
  expect(typeof body.per_page).toBe('number')
})

test('geo_cities API sözleşmesi: cities dizisi dönüyor', async ({ request }) => {
  const response = await request.get('https://api.parcabizden.com.tr/?action=geo_cities')
  expect(response.status()).toBe(200)

  const body = await response.json()
  expect(Array.isArray(body.cities)).toBe(true)
})

test('satıcı endpointi oturumsuz istekte 401 döndürüyor', async ({ request }) => {
  const response = await request.get('https://api.parcabizden.com.tr/?action=seller_me')
  expect(response.status()).toBe(401)
})

/**
 * Talep açma üyelik istemiyor — ürünün bilinçli farkı.
 * Referans platform (otodevi) talep göndermeden önce üyelik, adres ve
 * TC Kimlik istiyor; huni orada tıkanıyor. Bu test o kararı kilitliyor:
 * giriş yapmamış ziyaretçi forma ULAŞABİLMELİ, girişe yönlendirilmemeli.
 */
test('/talep-ac giriş yapmamış ziyaretçiye formu gösteriyor, girişe yönlendirmiyor', async ({ page }) => {
  await page.goto('/talep-ac')

  await expect(page).toHaveURL(/\/talep-ac/)
  expect(page.url()).not.toContain('/giris')

  // Telefon ve en az bir parça satırı görünür olmalı.
  await expect(page.getByLabel(/telefon/i).first()).toBeVisible()
  expect(await page.title()).toContain('Talep')
})

test('talep oluşturma endpointi yalnızca POST kabul ediyor', async ({ request }) => {
  const response = await request.get('https://api.parcabizden.com.tr/?action=request_create')
  const body = await response.json()
  expect(body.error).toContain('POST')
})

test('talep detayı erişim anahtarı olmadan açılmıyor', async ({ request }) => {
  // Anahtarsız istek, talep var olsa bile bulunamadı dönmeli — id denemeyle
  // başkasının talebi ve telefonu okunabilmemeli.
  const response = await request.get('https://api.parcabizden.com.tr/?action=request_detail&id=1')
  expect([400, 404]).toContain(response.status())
})
