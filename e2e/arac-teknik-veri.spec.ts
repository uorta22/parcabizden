import { test, expect } from '@playwright/test'

/**
 * Araç teknik veri sayfası — /arac/[ktype]
 *
 * ESKİ HATALAR:
 *  - Katalogda birden fazla motora ait veri karışmışken yanlış motorun
 *    (4511 ccm / 331 kW) verisi gösteriliyordu.
 *  - Teknik özellik değerleri bazen Rusça (Kiril alfabesi) geliyordu.
 *  - Çelişkili veri durumunda kullanıcı uyarılmıyordu.
 */

const VEHICLE_URL = `/arac/18465?${new URLSearchParams({
  b: 'BMW',
  m: '3 (E46)',
  v: '318 d',
}).toString()}`

test('doğru motor verisini gösterir, yanlış motor verisini gösterip Kiril karakter barındırmaz', async ({ page }) => {
  await page.goto(VEHICLE_URL)

  const specsHeading = page.getByRole('heading', { level: 2, name: 'Teknik Özellikler' })
  await expect(specsHeading).toBeVisible()

  const specsSection = page.locator('section').filter({ has: specsHeading })

  await expect(page.getByText('1995 ccm')).toBeVisible()

  const specsSectionText = await specsSection.innerText()
  expect(specsSectionText).not.toContain('4511 ccm')
  expect(specsSectionText).not.toContain('331 kW')
  expect(specsSectionText).not.toMatch(/[Ѐ-ӿ]/)

  await expect(specsSection.getByText(/birden fazla motor verisi/)).toBeVisible()
})
