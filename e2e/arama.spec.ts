import { test, expect } from '@playwright/test'

/**
 * /parcalar arama akışı.
 *
 * ESKİ HATA: Header'dan gelen `q` arama terimi araç seçilmeden önce
 * sessizce yutuluyordu, kullanıcı ne olduğunu anlamıyordu.
 */

test('arama terimi araç seçilmeden önce kullanıcıya bildiriliyor', async ({ page }) => {
  await page.goto(`/parcalar?${new URLSearchParams({ q: 'fren diski' }).toString()}`)

  const notice = page.getByText(/aramanız kaydedildi/)
  await expect(notice).toBeVisible()
  await expect(notice).toContainText('fren diski')
})
