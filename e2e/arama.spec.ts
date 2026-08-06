import { test, expect } from '@playwright/test'

/**
 * /parcalar arama akışı.
 *
 * ESKİ HATA: Header'dan gelen `q` arama terimi araç seçilmeden önce
 * sessizce yutuluyordu, kullanıcı ne olduğunu anlamıyordu.
 */

test('arama terimi araç seçilmeden önce kullanıcıya bildiriliyor', async ({ page }) => {
  await page.goto(`/parcalar?${new URLSearchParams({ q: 'fren diski' }).toString()}`)

  await expect(page.getByText(/aramanız kaydedildi/)).toBeVisible()
  await expect(page.getByText('fren diski')).toBeVisible()
})
