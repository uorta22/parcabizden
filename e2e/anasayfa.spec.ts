import { test, expect } from '@playwright/test'

/**
 * Anasayfa temel regresyon kilidi.
 *
 * ESKİ HATA: Çerez banner'ındaki "Gizlilik Politikası" linki /gizlilik-politikasi'ye
 * gidip 404 veriyordu — doğru rota /gizlilik.
 */

test('anasayfa 200 döner ve ana başlığı gösterir', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)

  await expect(
    page.getByRole('heading', { level: 1 }).filter({ hasText: 'Aracınıza özel yedek parçayı' })
  ).toBeVisible()
})

test('çerez banner\'ındaki Gizlilik Politikası linki /gizlilik\'e gider ve sayfa 200 döner', async ({ page }) => {
  await page.goto('/')

  const banner = page.getByRole('dialog', { name: 'Çerez bildirimi' })
  await expect(banner).toBeVisible()

  const privacyLink = banner.getByRole('link', { name: 'Gizlilik Politikası' }).first()
  await expect(privacyLink).toHaveAttribute('href', '/gizlilik')

  await privacyLink.click()
  await page.waitForURL('**/gizlilik')

  const response = await page.request.get('/gizlilik')
  expect(response.status()).toBe(200)
})
