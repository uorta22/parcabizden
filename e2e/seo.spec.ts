import { test, expect } from '@playwright/test'

/**
 * SEO temelleri: robots.txt, sitemap.xml, title şablonu, 404.
 *
 * ESKİ HATALAR:
 *  - /robots.txt dev ortamında 500 dönüyordu.
 *  - Sayfa title'larında "| ParcaBizden" iki kez tekrarlanıyordu.
 */

test('/robots.txt 200 döner ve /hesabim/ engellenmiş', async ({ request }) => {
  const response = await request.get('/robots.txt')
  expect(response.status()).toBe(200)

  const body = await response.text()
  expect(body).toContain('Disallow: /hesabim/')
})

test('/sitemap.xml 200 döner', async ({ request }) => {
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
})

test('/parcalar ve /arac/18465 title\'ında "| ParcaBizden" sadece bir kez geçer', async ({ page }) => {
  await page.goto('/parcalar')
  const parcalarTitle = await page.title()
  expect(countOccurrences(parcalarTitle, '| ParcaBizden')).toBe(1)

  await page.goto('/arac/18465')
  const aracTitle = await page.title()
  expect(countOccurrences(aracTitle, '| ParcaBizden')).toBe(1)
})

test('var olmayan bir route 404 döner', async ({ page }) => {
  const response = await page.goto('/bu-route-hic-var-olmadi-xyz-123')
  expect(response?.status()).toBe(404)
})

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}
